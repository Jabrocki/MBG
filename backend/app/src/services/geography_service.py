"""Privacy-aware data projection for the geographical map.

The application stores a submitted report's precise location for matching.  A map
is a different projection: an ordinary user can only receive their own raw report
pins, whereas shared needs are shown as aggregated/rounded canonical-problem pins.
Innovation locations are not fabricated.  They are included only when a recognised
Małopolska locality is present in the stored source text or provenance metadata.
"""

from __future__ import annotations

import math
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.problem import CanonicalProblem
from src.models.report import Report
from src.models.pilot import Pilot
from src.models.source import Solution
from src.models.geo_location import EntityGeoLocation
from src.models.user import User
from src.schemas.matchmaking import (
    MapCenterResponse,
    MapMarkerCountsResponse,
    MapMarkerResponse,
    MapMarkersResponse,
)
from src.utils.datetime_utils import utc_now


class GeographyService:
    DEFAULT_RADIUS_KM = 40.0
    MAX_RADIUS_KM = 100.0
    # A one- or two-reporter canonical problem must not expose the first reporter's
    # raw pin through an ostensibly public aggregate.
    MIN_REPORTERS_FOR_UNROUNDED_CENTROID = 3

    def __init__(self, db: Session):
        self.db = db

    def get_markers(
        self,
        user: User,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        radius_km: Optional[float] = None,
    ) -> MapMarkersResponse:
        self._validate_query(lat=lat, lon=lon, radius_km=radius_km)
        radius = radius_km if radius_km is not None else (self.DEFAULT_RADIUS_KM if lat is not None else None)
        center = MapCenterResponse(lat=lat, lon=lon) if lat is not None and lon is not None else None
        locations = self._locations_by_entity()

        markers: list[MapMarkerResponse] = []
        markers.extend(self._problem_markers(locations, lat, lon, radius))
        markers.extend(self._report_markers(locations, user, lat, lon, radius))
        innovation_markers, skipped_innovations = self._innovation_markers(locations, lat, lon, radius)
        markers.extend(innovation_markers)
        markers.extend(self._pilot_markers(locations, lat, lon, radius))
        markers.sort(key=lambda marker: (marker.distance_km is None, marker.distance_km or 0, marker.entity_type, marker.entity_id))

        return MapMarkersResponse(
            center=center,
            radius_km=radius,
            markers=markers,
            counts=MapMarkerCountsResponse(
                reports=sum(marker.entity_type == "report" for marker in markers),
                problems=sum(marker.entity_type == "problem" for marker in markers),
                innovations=sum(marker.entity_type == "innovation" for marker in markers),
                pilots=sum(marker.entity_type == "pilot" for marker in markers),
                innovations_without_known_location=skipped_innovations,
            ),
            privacy_note=(
                "Dokładne punkty zgłoszeń są widoczne wyłącznie ich autorowi oraz administratorowi. "
                "Punkty problemów wspólnych są agregowane, a przy mniej niż trzech zgłaszających zaokrąglane "
                "do obszaru około 1 km. Innowacje są pokazane tylko dla rozpoznanej miejscowości źródłowej."
            ),
        )

    def _validate_query(self, lat: Optional[float], lon: Optional[float], radius_km: Optional[float]) -> None:
        if (lat is None) != (lon is None):
            raise HTTPException(status_code=422, detail="Parametry lat i lon trzeba przekazać razem.")
        if lat is not None and not (-90 <= lat <= 90 and -180 <= lon <= 180):
            raise HTTPException(status_code=422, detail="Nieprawidłowe współrzędne WGS84.")
        if radius_km is not None and not (0.1 <= radius_km <= self.MAX_RADIUS_KM):
            raise HTTPException(
                status_code=422,
                detail=f"radius_km musi należeć do przedziału 0.1–{self.MAX_RADIUS_KM:g}.",
            )

    def _problem_markers(
        self,
        locations: dict[tuple[str, int], EntityGeoLocation],
        center_lat: Optional[float],
        center_lon: Optional[float],
        radius_km: Optional[float],
    ) -> list[MapMarkerResponse]:
        problems = self.db.execute(
            select(CanonicalProblem).where(CanonicalProblem.status == "active")
        ).scalars().all()
        markers: list[MapMarkerResponse] = []
        for problem in problems:
            stored = locations.get(("problem", problem.id))
            stored_lat = stored.latitude if stored else problem.location_centroid_lat
            stored_lon = stored.longitude if stored else problem.location_centroid_lon
            if problem.reporter_count < self.MIN_REPORTERS_FOR_UNROUNDED_CENTROID:
                marker_lat, marker_lon, precision = (
                    round(stored_lat, 2),
                    round(stored_lon, 2),
                    "area",
                )
                location_name = "Przybliżony obszar problemu"
            else:
                marker_lat, marker_lon, precision = (
                    stored_lat,
                    stored_lon,
                    "aggregate",
                )
                location_name = "Obszar zagregowany"
            distance = self._distance(center_lat, center_lon, marker_lat, marker_lon)
            if not self._within_radius(distance, radius_km):
                continue
            markers.append(
                MapMarkerResponse(
                    id=f"problem:{problem.id}",
                    entity_type="problem",
                    entity_id=problem.id,
                    title=problem.title,
                    lat=marker_lat,
                    lon=marker_lon,
                    location_name=location_name,
                    precision=precision,
                    visibility="authenticated",
                    distance_km=distance,
                    reporter_count=problem.reporter_count,
                    status=problem.status,
                )
            )
        return markers

    def _report_markers(
        self,
        locations: dict[tuple[str, int], EntityGeoLocation],
        user: User,
        center_lat: Optional[float],
        center_lon: Optional[float],
        radius_km: Optional[float],
    ) -> list[MapMarkerResponse]:
        statement = select(Report).where(Report.expires_at > utc_now())
        if user.role != "admin":
            statement = statement.where(Report.author_id == user.id)
        reports = self.db.execute(statement).scalars().all()
        markers: list[MapMarkerResponse] = []
        for report in reports:
            stored = locations.get(("report", report.id))
            marker_lat = stored.latitude if stored else report.location_lat
            marker_lon = stored.longitude if stored else report.location_lon
            distance = self._distance(center_lat, center_lon, marker_lat, marker_lon)
            if not self._within_radius(distance, radius_km):
                continue
            visibility = "admin" if user.role == "admin" and report.author_id != user.id else "private"
            markers.append(
                MapMarkerResponse(
                    id=f"report:{report.id}",
                    entity_type="report",
                    entity_id=report.id,
                    title=(f"Zgłoszenie #{report.id}" if visibility == "admin" else f"Moje zgłoszenie #{report.id}"),
                    lat=marker_lat,
                    lon=marker_lon,
                    location_name=stored.locality if stored and stored.locality else report.location_name,
                    precision="exact",
                    visibility=visibility,
                    distance_km=distance,
                    status=report.status,
                    category=", ".join(report.categories or []) or None,
                )
            )
        return markers

    def _innovation_markers(
        self,
        locations: dict[tuple[str, int], EntityGeoLocation],
        center_lat: Optional[float],
        center_lon: Optional[float],
        radius_km: Optional[float],
    ) -> tuple[list[MapMarkerResponse], int]:
        solutions = self.db.execute(select(Solution).order_by(Solution.id)).scalars().all()
        markers: list[MapMarkerResponse] = []
        skipped = 0
        for solution in solutions:
            stored = locations.get(("innovation", solution.id))
            if stored is None:
                skipped += 1
                continue
            distance = self._distance(center_lat, center_lon, stored.latitude, stored.longitude)
            if not self._within_radius(distance, radius_km):
                continue
            source = solution.source_knowledge
            markers.append(
                MapMarkerResponse(
                    id=f"innovation:{solution.id}",
                    entity_type="innovation",
                    entity_id=solution.id,
                    title=solution.title,
                    lat=stored.latitude,
                    lon=stored.longitude,
                    location_name=stored.locality or "Małopolska",
                    precision=stored.precision,
                    visibility="authenticated",
                    distance_km=distance,
                    category=source.category if source else None,
                    source_url=source.source_url if source else None,
                )
            )
        return markers, skipped

    def _pilot_markers(
        self,
        locations: dict[tuple[str, int], EntityGeoLocation],
        center_lat: Optional[float],
        center_lon: Optional[float],
        radius_km: Optional[float],
    ) -> list[MapMarkerResponse]:
        pilots = self.db.execute(select(Pilot).order_by(Pilot.created_at.desc())).scalars().all()
        markers: list[MapMarkerResponse] = []
        for pilot in pilots:
            stored = locations.get(("pilot", pilot.id))
            if stored is None:
                continue
            distance = self._distance(center_lat, center_lon, stored.latitude, stored.longitude)
            if not self._within_radius(distance, radius_km):
                continue
            markers.append(
                MapMarkerResponse(
                    id=f"pilot:{pilot.id}",
                    entity_type="pilot",
                    entity_id=pilot.id,
                    title=pilot.title,
                    lat=stored.latitude,
                    lon=stored.longitude,
                    location_name=stored.locality or "Małopolska",
                    precision=stored.precision,
                    visibility="authenticated",
                    distance_km=distance,
                    status=pilot.status,
                )
            )
        return markers

    def _locations_by_entity(self) -> dict[tuple[str, int], EntityGeoLocation]:
        rows = self.db.execute(
            select(EntityGeoLocation).where(
                EntityGeoLocation.entity_type.in_(("report", "problem", "innovation", "pilot"))
            )
        ).scalars().all()
        return {(row.entity_type, row.entity_id): row for row in rows}

    @staticmethod
    def _distance(
        center_lat: Optional[float],
        center_lon: Optional[float],
        target_lat: float,
        target_lon: float,
    ) -> Optional[float]:
        if center_lat is None or center_lon is None:
            return None
        earth_radius_km = 6371.0
        d_lat = math.radians(target_lat - center_lat)
        d_lon = math.radians(target_lon - center_lon)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(center_lat))
            * math.cos(math.radians(target_lat))
            * math.sin(d_lon / 2) ** 2
        )
        return round(2 * earth_radius_km * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)

    @staticmethod
    def _within_radius(distance_km: Optional[float], radius_km: Optional[float]) -> bool:
        return distance_km is None or radius_km is None or distance_km <= radius_km

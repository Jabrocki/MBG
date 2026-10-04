"""Persistent WGS84 location extraction and backfill for HUBMI domain records.

Only coordinates already stored by the application or a locality explicitly present
in a source/pilot text are persisted.  A source with no known Małopolska locality is
left unlocated rather than being placed at a regional centroid.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Iterable, Optional

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from src.models.geo_location import EntityGeoLocation
from src.models.pilot import Pilot
from src.models.problem import CanonicalProblem
from src.models.report import Report
from src.models.source import Solution
from src.utils.datetime_utils import utc_now


@dataclass(frozen=True)
class Locality:
    name: str
    latitude: float
    longitude: float


@dataclass(frozen=True)
class ResolvedLocation:
    latitude: float
    longitude: float
    locality: str
    precision: str = "municipality"


# Curated WGS84 centroids for localities occurring in the retained Małopolska corpus.
# This avoids disclosing source text to an external geocoder and makes a backfill
# repeatable.  Values represent a municipality/city centroid, never an address.
LOCALITIES: tuple[Locality, ...] = (
    Locality("Dąbrowa Tarnowska", 50.1742, 20.9877),
    Locality("Sucha Beskidzka", 49.7416, 19.5941),
    Locality("Nowy Sącz", 49.6218, 20.6970),
    Locality("Nowy Targ", 49.4778, 20.0321),
    Locality("Lipnica Wielka", 49.4775, 19.6382),
    Locality("Niepołomice", 50.0407, 20.2183),
    Locality("Myślenice", 49.8338, 19.9383),
    Locality("Wieliczka", 49.9874, 20.0647),
    Locality("Oświęcim", 50.0344, 19.2100),
    Locality("Zakopane", 49.2992, 19.9496),
    Locality("Proszowice", 50.1920, 20.2891),
    Locality("Charsznica", 50.4076, 19.9343),
    Locality("Kraków", 50.0619, 19.9368),
    Locality("Tarnów", 50.0121, 20.9858),
    Locality("Wadowice", 49.8830, 19.4927),
    Locality("Chrzanów", 50.1412, 19.4020),
    Locality("Limanowa", 49.7050, 20.4222),
    Locality("Gorlice", 49.6556, 21.1590),
    Locality("Bochnia", 49.9691, 20.4300),
    Locality("Brzesko", 49.9691, 20.6061),
    Locality("Brzeszcze", 49.9826, 19.1519),
    Locality("Czchów", 49.8370, 20.6800),
    Locality("Miechów", 50.3565, 20.0279),
    Locality("Olkusz", 50.2813, 19.5650),
    Locality("Liszki", 50.0398, 19.7680),
    Locality("Skała", 50.2300, 19.8536),
    Locality("Kęty", 49.8827, 19.2233),
    Locality("Skawina", 49.9752, 19.8287),
    Locality("Gdów", 49.9082, 20.1988),
    Locality("Biskupice", 49.9441, 20.1232),
)


def _normalise(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    without_marks = "".join(char for char in decomposed if not unicodedata.combining(char))
    return without_marks.translate(str.maketrans({"ł": "l", "Ł": "l"})).casefold()


LOCALITY_PATTERNS: tuple[tuple[Locality, re.Pattern[str]], ...] = tuple(
    (
        locality,
        re.compile(rf"(?<![a-z0-9]){re.escape(_normalise(locality.name))}(?![a-z0-9])"),
    )
    for locality in sorted(LOCALITIES, key=lambda item: len(_normalise(item.name)), reverse=True)
)


def extract_declared_locality(text: str) -> Optional[str]:
    """Return a source's explicit Markdown ``Lokalizacja`` value, when present."""
    match = re.search(r"(?:^|\n)#{1,3}\s*Lokalizacja\s*\n+([^\n#]+)", text, flags=re.IGNORECASE)
    if not match:
        return None
    locality = " ".join(match.group(1).strip().split())
    return locality[:255] or None


def resolve_locality(texts: Iterable[str]) -> Optional[ResolvedLocation]:
    usable_texts = [text for text in texts if text]
    body = " ".join(usable_texts)
    normalised = _normalise(body)
    for locality, pattern in LOCALITY_PATTERNS:
        if pattern.search(normalised):
            declared = next((extract_declared_locality(text) for text in usable_texts if extract_declared_locality(text)), None)
            return ResolvedLocation(
                latitude=locality.latitude,
                longitude=locality.longitude,
                locality=declared or locality.name,
            )
    return None


class EntityGeoLocationService:
    """Owns the compatible geo projection and its idempotent data backfill."""

    def __init__(self, db: Session):
        self.db = db

    def get(self, entity_type: str, entity_id: int) -> Optional[EntityGeoLocation]:
        return self.db.execute(
            select(EntityGeoLocation).where(
                and_(
                    EntityGeoLocation.entity_type == entity_type,
                    EntityGeoLocation.entity_id == entity_id,
                )
            )
        ).scalar_one_or_none()

    def upsert(
        self,
        *,
        entity_type: str,
        entity_id: int,
        latitude: float,
        longitude: float,
        locality: Optional[str],
        precision: str,
        source_knowledge_id: Optional[int] = None,
    ) -> tuple[EntityGeoLocation, str]:
        record = self.get(entity_type, entity_id)
        if record is None:
            record = EntityGeoLocation(
                entity_type=entity_type,
                entity_id=entity_id,
                latitude=latitude,
                longitude=longitude,
                locality=locality,
                precision=precision,
                source_knowledge_id=source_knowledge_id,
                created_at=utc_now(),
            )
            self.db.add(record)
            return record, "created"

        values_changed = any(
            (
                record.latitude != latitude,
                record.longitude != longitude,
                record.locality != locality,
                record.precision != precision,
                record.source_knowledge_id != source_knowledge_id,
            )
        )
        if values_changed:
            record.latitude = latitude
            record.longitude = longitude
            record.locality = locality
            record.precision = precision
            record.source_knowledge_id = source_knowledge_id
            record.updated_at = utc_now()
            return record, "updated"
        return record, "unchanged"

    def persist_report(self, report: Report) -> tuple[EntityGeoLocation, str]:
        return self.upsert(
            entity_type="report",
            entity_id=report.id,
            latitude=report.location_lat,
            longitude=report.location_lon,
            locality=report.location_name,
            precision="exact",
        )

    def persist_problem(self, problem: CanonicalProblem) -> tuple[EntityGeoLocation, str]:
        return self.upsert(
            entity_type="problem",
            entity_id=problem.id,
            latitude=problem.location_centroid_lat,
            longitude=problem.location_centroid_lon,
            locality="Obszar zagregowany",
            precision="aggregate",
        )

    def resolve_solution(self, solution: Solution) -> Optional[ResolvedLocation]:
        source = solution.source_knowledge
        metadata = source.provenance_metadata if source and isinstance(source.provenance_metadata, dict) else {}
        metadata_text = " ".join(
            str(value)
            for key, value in metadata.items()
            if key.casefold() in {"location", "location_name", "rejon", "region", "gmina", "powiat", "city", "miasto"}
        )
        return resolve_locality(
            (
                solution.title,
                solution.description,
                source.title if source else "",
                source.content_summary if source else "",
                metadata_text,
            )
        )

    def persist_innovation(self, solution: Solution) -> Optional[tuple[EntityGeoLocation, str]]:
        location = self.resolve_solution(solution)
        if not location:
            return None
        return self.upsert(
            entity_type="innovation",
            entity_id=solution.id,
            latitude=location.latitude,
            longitude=location.longitude,
            locality=location.locality,
            precision=location.precision,
            source_knowledge_id=solution.source_knowledge_id,
        )

    def resolve_pilot(self, pilot: Pilot) -> Optional[ResolvedLocation]:
        if pilot.solution_id:
            innovation = self.get("innovation", pilot.solution_id)
            if innovation:
                return ResolvedLocation(
                    latitude=innovation.latitude,
                    longitude=innovation.longitude,
                    locality=innovation.locality or "Małopolska",
                    precision=innovation.precision,
                )
            if pilot.solution:
                location = self.resolve_solution(pilot.solution)
                if location:
                    return location

        idea = pilot.idea
        return resolve_locality(
            (
                pilot.title,
                pilot.description,
                idea.text_refined if idea and idea.text_refined else "",
                idea.text_raw if idea else "",
            )
        )

    def persist_pilot(self, pilot: Pilot) -> Optional[tuple[EntityGeoLocation, str]]:
        location = self.resolve_pilot(pilot)
        if not location:
            return None
        source_knowledge_id = pilot.solution.source_knowledge_id if pilot.solution else None
        return self.upsert(
            entity_type="pilot",
            entity_id=pilot.id,
            latitude=location.latitude,
            longitude=location.longitude,
            locality=location.locality,
            precision=location.precision,
            source_knowledge_id=source_knowledge_id,
        )

    def backfill_all(self, *, commit: bool = True) -> dict[str, dict[str, int]]:
        """Idempotently persist every existing domain location that is trustworthy.

        Reports and canonical problems already have validated coordinates.  Innovations
        and pilots are included only after exact locality recognition from stored data.
        """
        stats = {
            entity_type: {"created": 0, "updated": 0, "unchanged": 0, "skipped": 0}
            for entity_type in ("report", "problem", "innovation", "pilot")
        }

        for report in self.db.execute(select(Report)).scalars():
            _, state = self.persist_report(report)
            stats["report"][state] += 1

        for problem in self.db.execute(select(CanonicalProblem)).scalars():
            _, state = self.persist_problem(problem)
            stats["problem"][state] += 1

        for solution in self.db.execute(select(Solution)).scalars():
            result = self.persist_innovation(solution)
            if result is None:
                stats["innovation"]["skipped"] += 1
                continue
            _, state = result
            stats["innovation"][state] += 1

        for pilot in self.db.execute(select(Pilot)).scalars():
            result = self.persist_pilot(pilot)
            if result is None:
                stats["pilot"]["skipped"] += 1
                continue
            _, state = result
            stats["pilot"][state] += 1

        if commit:
            self.db.commit()
        return stats

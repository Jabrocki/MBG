import math
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from src.models.source import Solution, SourceKnowledge
from src.models.problem import CanonicalProblem
from src.schemas.matchmaking import CanonicalProblemResponse

class CatalogueService:
    def __init__(self, db: Session):
        self.db = db

    def search_catalogue(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50,
    ) -> List[dict]:
        stmt = select(Solution)
        if query:
            stmt = stmt.where(Solution.title.ilike(f"%{query}%") | Solution.description.ilike(f"%{query}%"))
        
        solutions = self.db.execute(stmt.limit(limit)).scalars().all()
        results = []
        for s in solutions:
            source = s.source_knowledge
            if category and source and source.category != category:
                continue
            results.append({
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "target_audience": s.target_audience,
                "cost_estimate": s.cost_estimate,
                "limitations": s.limitations,
                "category": source.category if source else "Ogólne",
                "source_url": source.source_url if source else None,
            })
        return results

    def get_nearby_problems(
        self,
        lat: float,
        lon: float,
        radius_km: float = 15.0,
    ) -> List[CanonicalProblemResponse]:
        """Finds active problems within given radius, ordered algorithmically by unique-reporter count.
        Discovery radius is independent of grouping thresholds.
        """
        problems = self.db.execute(
            select(CanonicalProblem).where(CanonicalProblem.status == "active")
        ).scalars().all()

        nearby = []
        for p in problems:
            dist = self._haversine_distance(lat, lon, p.location_centroid_lat, p.location_centroid_lon)
            if dist <= radius_km:
                nearby.append(p)

        # Rank by unique-reporter count descending
        nearby.sort(key=lambda p: p.reporter_count, reverse=True)

        return [
            CanonicalProblemResponse(
                id=p.id,
                title=p.title,
                generated_description=p.generated_description,
                reporter_count=p.reporter_count,
                location_centroid_lat=p.location_centroid_lat,
                location_centroid_lon=p.location_centroid_lon,
                status=p.status,
                recurrence_recommended=p.recurrence_recommended,
                created_at=p.created_at,
            )
            for p in nearby
        ]

    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

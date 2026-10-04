import math
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from src.models.source import Solution, SourceKnowledge
from src.models.vote import Vote
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
        
        solutions = self.db.execute(stmt).scalars().all()
        vote_rows = self.db.execute(
            select(Vote.solution_id, Vote.vote_type, func.count(Vote.id))
            .group_by(Vote.solution_id, Vote.vote_type)
        ).all()
        votes_by_solution: dict[int, dict[str, int]] = {}
        for solution_id, vote_type, count in vote_rows:
            votes_by_solution.setdefault(solution_id, {})[vote_type] = count
        solutions = sorted(
            solutions,
            key=lambda item: (
                votes_by_solution.get(item.id, {}).get("support", 0)
                - votes_by_solution.get(item.id, {}).get("skip", 0),
                votes_by_solution.get(item.id, {}).get("support", 0),
                item.id,
            ),
            reverse=True,
        )[:limit]
        results = []
        for s in solutions:
            source = s.source_knowledge
            if category and source and source.category != category:
                continue
            results.append(self._project_solution(s, votes_by_solution.get(s.id, {})))
        return results

    def get_catalogue_item(self, solution_id: int) -> dict:
        solution = self.db.get(Solution, solution_id)
        if not solution:
            raise HTTPException(status_code=404, detail="Innowacja nie została odnaleziona")
        vote_counts = dict(
            self.db.execute(
                select(Vote.vote_type, func.count(Vote.id))
                .where(Vote.solution_id == solution.id)
                .group_by(Vote.vote_type)
            ).all()
        )
        return self._project_solution(solution, vote_counts)

    @staticmethod
    def _project_solution(solution: Solution, vote_counts: dict[str, int] | None = None) -> dict:
        source = solution.source_knowledge
        vote_counts = vote_counts or {}
        description = solution.description
        # Imported ROPS markdown stores metadata and links before the actual
        # description. Keep only the readable document body for the UI.
        if "## Opis" in description:
            description = description.split("## Opis", 1)[1].strip()
        return {
            "id": solution.id,
            "title": solution.title,
            "description": description,
            "target_audience": solution.target_audience,
            "cost_estimate": solution.cost_estimate,
            "limitations": solution.limitations,
            "category": source.category if source else "Ogólne",
            "source_url": source.source_url if source else None,
            "support_count": vote_counts.get("support", 0),
            "skip_count": vote_counts.get("skip", 0),
            "vote_score": vote_counts.get("support", 0) - vote_counts.get("skip", 0),
        }

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
            self._project_problem(p)
            for p in nearby
        ]

    def get_problem(self, problem_id: int) -> CanonicalProblemResponse:
        problem = self.db.get(CanonicalProblem, problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="Problem nie został odnaleziony")
        return self._project_problem(problem)

    @staticmethod
    def _project_problem(problem: CanonicalProblem) -> CanonicalProblemResponse:
        return CanonicalProblemResponse(
            id=problem.id,
            title=problem.title,
            generated_description=problem.generated_description,
            reporter_count=problem.reporter_count,
            location_centroid_lat=problem.location_centroid_lat,
            location_centroid_lon=problem.location_centroid_lon,
            status=problem.status,
            recurrence_recommended=problem.recurrence_recommended,
            created_at=problem.created_at,
        )

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

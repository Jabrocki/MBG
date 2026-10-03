from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.config import settings
from src.models.problem import CanonicalProblem
from src.models.source import Solution, SourceKnowledge
from src.models.match import MatchResult
from src.schemas.matchmaking import (
    MatchListResponse,
    InnovationMatchResponse,
    CoordinatesResponse,
    Coordinate3D,
)
from src.adapters.ai_gateway import get_ai_gateway

class MatchingService:
    def __init__(self, db: Session):
        self.db = db
        self.ai = get_ai_gateway()

    def get_matches_for_problem(self, problem_id: int) -> MatchListResponse:
        problem = self.db.get(CanonicalProblem, problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="Problem nie został odnaleziony")

        # 1. Sprawdź, czy są już zapisane dopasowania
        existing_matches = self.db.execute(
            select(MatchResult)
            .where(MatchResult.problem_id == problem_id)
            .order_by(MatchResult.rank.asc())
        ).scalars().all()

        if existing_matches:
            match_responses = []
            for m in existing_matches:
                sol = self.db.get(Solution, m.solution_id)
                source_url = sol.source_knowledge.source_url if (sol and sol.source_knowledge) else None
                match_responses.append(
                    InnovationMatchResponse(
                        solution_id=m.solution_id,
                        title=sol.title if sol else "Innowacja",
                        description=sol.description if sol else "",
                        rank=m.rank,
                        score=m.score,
                        explanation=m.explanation,
                        limitations=m.limitations,
                        source_url=source_url,
                        coord_x=m.coord_x,
                        coord_y=m.coord_y,
                        coord_z=m.coord_z,
                    )
                )
            return MatchListResponse(
                problem_id=problem.id,
                total_matches=len(match_responses),
                matches=match_responses[:10],
            )

        # 2. Jeśli nie ma, pobierz z AI Gateway i zapisz
        ai_matches = self.ai.match_solutions_for_problem(
            problem_id=problem.id,
            description=problem.generated_description,
            categories=[],
            lat=problem.location_centroid_lat,
            lon=problem.location_centroid_lon,
        )

        match_responses = []
        for am in ai_matches:
            if am.score < settings.MIN_MATCH_SCORE:
                continue

            # Upewnij się, że rozwiązanie istnieje w bazie
            sol = self.db.get(Solution, am.solution_id)
            if not sol:
                # Utwórz syntezę rozwiązania jeśli nie było wcześniej zainicjalizowane
                sol = Solution(
                    id=am.solution_id,
                    title=f"Innowacja #{am.solution_id}: Wsparcie środowiskowe",
                    description="Rozwiązanie społeczne z bazy ROPS Małopolska.",
                    limitations=am.limitations,
                )
                self.db.add(sol)
                self.db.flush()

            # Zapisz wynik dopasowania
            mr = MatchResult(
                problem_id=problem.id,
                solution_id=sol.id,
                rank=am.rank,
                score=am.score,
                explanation=am.explanation,
                limitations=am.limitations,
                coord_x=am.coord_x,
                coord_y=am.coord_y,
                coord_z=am.coord_z,
            )
            self.db.add(mr)

            source_url = sol.source_knowledge.source_url if sol.source_knowledge else None
            match_responses.append(
                InnovationMatchResponse(
                    solution_id=sol.id,
                    title=sol.title,
                    description=sol.description,
                    rank=am.rank,
                    score=am.score,
                    explanation=am.explanation,
                    limitations=am.limitations,
                    source_url=source_url,
                    coord_x=am.coord_x,
                    coord_y=am.coord_y,
                    coord_z=am.coord_z,
                )
            )

        self.db.commit()

        # Zwracamy maksymalnie 10 dopasowań
        return MatchListResponse(
            problem_id=problem.id,
            total_matches=len(match_responses),
            matches=match_responses[:10],
        )

    def get_coordinates_for_problem(self, problem_id: int) -> CoordinatesResponse:
        """Returns 3D semantic coordinate space for problem and its candidate solutions."""
        matches = self.get_matches_for_problem(problem_id)
        problem = self.db.get(CanonicalProblem, problem_id)

        problem_coord = Coordinate3D(
            id=problem.id,
            entity_type="problem",
            title=problem.title,
            x=0.0,
            y=0.0,
            z=0.0,
        )

        solution_coords = [
            Coordinate3D(
                id=m.solution_id,
                entity_type="solution",
                title=m.title,
                x=m.coord_x,
                y=m.coord_y,
                z=m.coord_z,
            )
            for m in matches.matches
        ]

        return CoordinatesResponse(
            problem_id=problem.id,
            problem_coords=problem_coord,
            solution_coords=solution_coords,
        )

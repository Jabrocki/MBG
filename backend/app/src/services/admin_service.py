from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func, distinct, update, and_

from src.models.user import User
from src.models.problem import CanonicalProblem, ReportProblemLink
from src.models.report import Report
from src.models.source import Solution
from src.models.vote import Vote
from src.models.match import MatchResult
from src.schemas.modules import (
    MergeProblemsRequest,
    SplitProblemRequest,
    MergeSolutionsRequest,
)
from src.schemas.matchmaking import CanonicalProblemResponse

class AdminService:
    def __init__(self, db: Session):
        self.db = db

    def merge_problems(self, data: MergeProblemsRequest, admin: User) -> CanonicalProblemResponse:
        """Merges multiple problems into target_problem.
        Reconciles unique reporters, moves report links, merges votes, and marks sources as merged.
        """
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")

        target = self.db.get(CanonicalProblem, data.target_problem_id)
        if not target:
            raise HTTPException(status_code=404, detail="Problem docelowy nie istnieje")

        for src_id in data.source_problem_ids:
            if src_id == data.target_problem_id:
                continue
            src = self.db.get(CanonicalProblem, src_id)
            if not src:
                continue

            # 1. Przepnij raporty
            self.db.execute(
                update(Report)
                .where(Report.canonical_problem_id == src.id)
                .values(canonical_problem_id=target.id)
            )

            # 2. Przepnij linki raportów
            self.db.execute(
                update(ReportProblemLink)
                .where(ReportProblemLink.problem_id == src.id)
                .values(problem_id=target.id)
            )

            # 3. Przepnij głosy (unikając konfliktów unikalności user+solution+target)
            votes_to_move = self.db.execute(
                select(Vote).where(Vote.local_problem_id == src.id)
            ).scalars().all()

            for v in votes_to_move:
                existing_target_vote = self.db.execute(
                    select(Vote).where(
                        and_(
                            Vote.user_id == v.user_id,
                            Vote.solution_id == v.solution_id,
                            Vote.local_problem_id == target.id,
                        )
                    )
                ).scalar_one_or_none()

                if not existing_target_vote:
                    v.local_problem_id = target.id
                else:
                    # Konflikt: zachowaj istniejący głos na target, usuń duplikat
                    self.db.delete(v)

            # 4. Oznacz problem źródłowy jako 'merged'
            src.status = "merged"

        self.db.commit()

        # 5. Przelicz unikalnych zgłaszających dla problemu docelowego
        unique_reporters = self.db.execute(
            select(func.count(distinct(Report.author_id)))
            .where(Report.canonical_problem_id == target.id)
        ).scalar() or 1

        target.reporter_count = unique_reporters
        self.db.commit()
        self.db.refresh(target)

        return CanonicalProblemResponse(
            id=target.id,
            title=target.title,
            generated_description=target.generated_description,
            reporter_count=target.reporter_count,
            location_centroid_lat=target.location_centroid_lat,
            location_centroid_lon=target.location_centroid_lon,
            status=target.status,
            recurrence_recommended=target.recurrence_recommended,
            created_at=target.created_at,
        )

    def split_problem(self, data: SplitProblemRequest, admin: User) -> CanonicalProblemResponse:
        """Splits selected reports away from source problem into a new canonical problem."""
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")

        source = self.db.get(CanonicalProblem, data.problem_id)
        if not source:
            raise HTTPException(status_code=404, detail="Problem źródłowy nie istnieje")

        # Utwórz nowy problem kanoniczny
        new_problem = CanonicalProblem(
            title=data.new_problem_title,
            generated_description=f"Wydzielony problem z: {source.title}",
            reporter_count=1,
            location_centroid_lat=source.location_centroid_lat,
            location_centroid_lon=source.location_centroid_lon,
            status="active",
            created_at=utc_now(),
        )
        self.db.add(new_problem)
        self.db.flush()

        # Przepnij wybrane raporty
        for r_id in data.report_ids_to_detach:
            rep = self.db.get(Report, r_id)
            if rep and rep.canonical_problem_id == source.id:
                rep.canonical_problem_id = new_problem.id

        self.db.commit()

        # Przelicz unikalnych zgłaszających dla obu problemów
        src_reporters = self.db.execute(
            select(func.count(distinct(Report.author_id)))
            .where(Report.canonical_problem_id == source.id)
        ).scalar() or 1
        source.reporter_count = src_reporters

        new_reporters = self.db.execute(
            select(func.count(distinct(Report.author_id)))
            .where(Report.canonical_problem_id == new_problem.id)
        ).scalar() or 1
        new_problem.reporter_count = new_reporters

        self.db.commit()
        self.db.refresh(new_problem)

        return CanonicalProblemResponse(
            id=new_problem.id,
            title=new_problem.title,
            generated_description=new_problem.generated_description,
            reporter_count=new_problem.reporter_count,
            location_centroid_lat=new_problem.location_centroid_lat,
            location_centroid_lon=new_problem.location_centroid_lon,
            status=new_problem.status,
            recurrence_recommended=new_problem.recurrence_recommended,
            created_at=new_problem.created_at,
        )

    def merge_solutions(self, data: MergeSolutionsRequest, admin: User) -> None:
        """Merges duplicate solutions into target solution."""
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")

        target = self.db.get(Solution, data.target_solution_id)
        if not target:
            raise HTTPException(status_code=404, detail="Rozwiązanie docelowe nie istnieje")

        for dup_id in data.duplicate_solution_ids:
            if dup_id == data.target_solution_id:
                continue
            dup = self.db.get(Solution, dup_id)
            if not dup:
                continue

            # Przepnij głosy
            dup_votes = self.db.execute(
                select(Vote).where(Vote.solution_id == dup.id)
            ).scalars().all()

            for v in dup_votes:
                existing = self.db.execute(
                    select(Vote).where(
                        and_(
                            Vote.user_id == v.user_id,
                            Vote.solution_id == target.id,
                            Vote.local_problem_id == v.local_problem_id,
                        )
                    )
                ).scalar_one_or_none()

                if not existing:
                    v.solution_id = target.id
                else:
                    self.db.delete(v)

            # Usuń zduplikowane rozwiązanie
            self.db.delete(dup)

        self.db.commit()

from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func, distinct, update, and_

from src.models.user import User
from src.models.problem import CanonicalProblem, ReportProblemLink
from src.models.report import Report
from src.models.source import Solution, SourceKnowledge
from src.models.vote import Vote
from src.models.match import MatchResult
from src.models.idea import Idea
from src.models.pilot import Pilot
from src.services.geo_location_service import EntityGeoLocationService
from src.schemas.modules import (
    AdminCatalogueCreateRequest,
    AdminCatalogueUpdateRequest,
    MergeProblemsRequest,
    SplitProblemRequest,
    MergeSolutionsRequest,
)
from src.schemas.matchmaking import CanonicalProblemResponse
from src.schemas.modules import AdminDashboardCountsResponse
from src.services.catalogue_service import CatalogueService

class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.geo_locations = EntityGeoLocationService(db)

    def get_dashboard_counts(self, admin: User) -> AdminDashboardCountsResponse:
        """Return database-backed queue and total counts for the administrator home."""
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")
        reports_total = self.db.scalar(select(func.count(Report.id))) or 0
        reports_waiting_grouping = self.db.scalar(
            select(func.count(Report.id)).where(Report.status != "confirmed")
        ) or 0
        ideas_total = self.db.scalar(select(func.count(Idea.id))) or 0
        ideas_waiting_admin = self.db.scalar(
            select(func.count(Idea.id)).where(Idea.status == "pending_admin")
        ) or 0
        pilots_total = self.db.scalar(select(func.count(Pilot.id))) or 0
        pilots_waiting_start = self.db.scalar(
            select(func.count(Pilot.id)).where(Pilot.status.in_(("draft", "review", "recruitment_funding")))
        ) or 0
        return AdminDashboardCountsResponse(
            reports_total=reports_total,
            reports_waiting_grouping=reports_waiting_grouping,
            ideas_total=ideas_total,
            ideas_waiting_admin=ideas_waiting_admin,
            pilots_total=pilots_total,
            pilots_waiting_start=pilots_waiting_start,
        )

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
        self.geo_locations.persist_problem(target)
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

        self.geo_locations.persist_problem(source)
        self.geo_locations.persist_problem(new_problem)

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

    def list_problems(self, admin: User) -> List[CanonicalProblemResponse]:
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")
        problems = self.db.execute(
            select(CanonicalProblem).order_by(CanonicalProblem.created_at.desc())
        ).scalars().all()
        return [CatalogueService._project_problem(problem) for problem in problems]

    def update_report_status(self, report_id: int, target_status: str, admin: User):
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")
        report = self.db.get(Report, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Zgłoszenie nie zostało odnalezione")
        report.status = target_status
        self.db.commit()
        self.db.refresh(report)
        from src.services.report_service import ReportService

        return ReportService(self.db).project_report(report, viewer=admin)

    def create_catalogue_item(self, data: AdminCatalogueCreateRequest, admin: User) -> dict:
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")
        source = SourceKnowledge(
            source_url=data.source_url.strip(),
            title=data.title.strip(),
            content_summary=data.description.strip(),
            category=data.category.strip(),
            provenance_metadata={"created_by": "admin"},
        )
        self.db.add(source)
        self.db.flush()
        solution = Solution(
            source_knowledge_id=source.id,
            title=data.title.strip(),
            description=data.description.strip(),
            target_audience=data.target_audience.strip() or "Nie wskazano",
            cost_estimate=data.cost_estimate.strip() or "Nie wskazano",
            limitations=data.limitations.strip(),
        )
        self.db.add(solution)
        self.db.commit()
        self.db.refresh(solution)
        return CatalogueService._project_solution(solution)

    def update_catalogue_item(
        self,
        solution_id: int,
        data: AdminCatalogueUpdateRequest,
        admin: User,
    ) -> dict:
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")
        solution = self.db.get(Solution, solution_id)
        if not solution:
            raise HTTPException(status_code=404, detail="Innowacja nie została odnaleziona")

        if data.title is not None:
            solution.title = data.title.strip()
        if data.description is not None:
            solution.description = data.description.strip()
        if data.target_audience is not None:
            solution.target_audience = data.target_audience.strip()
        if data.cost_estimate is not None:
            solution.cost_estimate = data.cost_estimate.strip()
        if data.limitations is not None:
            solution.limitations = data.limitations.strip()

        source = solution.source_knowledge
        if not source:
            source = SourceKnowledge(
                source_url=data.source_url.strip() if data.source_url else "admin://catalogue",
                title=solution.title,
                content_summary=solution.description,
                category=data.category.strip() if data.category else "Ogólne",
                provenance_metadata={"created_by": "admin"},
            )
            self.db.add(source)
            self.db.flush()
            solution.source_knowledge_id = source.id
        if data.category is not None:
            source.category = data.category.strip()
        if data.source_url is not None:
            source.source_url = data.source_url.strip()
        source.title = solution.title
        source.content_summary = solution.description
        self.db.commit()
        self.db.refresh(solution)
        return CatalogueService._project_solution(solution)

    def delete_catalogue_item(self, solution_id: int, admin: User) -> None:
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")
        solution = self.db.get(Solution, solution_id)
        if not solution:
            raise HTTPException(status_code=404, detail="Innowacja nie została odnaleziona")
        self.db.delete(solution)
        self.db.commit()

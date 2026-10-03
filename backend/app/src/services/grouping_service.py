from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, distinct

from src.models.user import User
from src.models.report import Report
from src.models.problem import CanonicalProblem, ReportProblemLink
from src.schemas.matchmaking import (
    ConfirmGroupingRequest,
    CanonicalProblemResponse,
)
from src.adapters.ai_gateway import get_ai_gateway
from src.adapters.vector_repository import VectorRepositoryAdapter

class GroupingService:
    def __init__(self, db: Session):
        self.db = db
        self.ai = get_ai_gateway()
        self.vector_repo = VectorRepositoryAdapter(db)

    def confirm_grouping(
        self,
        report_id: int,
        data: ConfirmGroupingRequest,
        user: User,
    ) -> CanonicalProblemResponse:
        report = self.db.get(Report, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Zgłoszenie nie zostało odnalezione")
        if report.author_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Brak uprawnień do przypisania tego zgłoszenia")

        if data.create_new or not data.confirmed_problem_id:
            # Tworzymy nowy problem kanoniczny
            hyde_result = self.ai.generate_hyde_and_embedding(
                text=report.text_raw,
                categories=report.categories or [],
            )

            title = report.text_raw[:60] + ("..." if len(report.text_raw) > 60 else "")
            problem = CanonicalProblem(
                title=title,
                generated_description=hyde_result.generated_description,
                reporter_count=1,
                location_centroid_lat=report.location_lat,
                location_centroid_lon=report.location_lon,
                status="active",
                created_at=utc_now(),
            )
            self.db.add(problem)
            self.db.flush()  # problem.id

            # Zapis wektora i współrzędnych 3D do vector repository
            self.vector_repo.upsert_vector_record(
                entity_type="problem",
                entity_id=problem.id,
                embedding=hyde_result.embedding,
                coord_x=0.0,
                coord_y=0.0,
                coord_z=0.0,
            )

            target_problem = problem
        else:
            # Przypisujemy do istniejącego problemu
            target_problem = self.db.get(CanonicalProblem, data.confirmed_problem_id)
            if not target_problem:
                raise HTTPException(status_code=404, detail="Wskazany problem nie istnieje")

        # Aktualizujemy link i zgłoszenie
        report.canonical_problem_id = target_problem.id
        report.status = "confirmed"

        # Tworzymy lub aktualizujemy link
        link = self.db.execute(
            select(ReportProblemLink).where(
                ReportProblemLink.report_id == report.id,
                ReportProblemLink.problem_id == target_problem.id,
            )
        ).scalar_one_or_none()

        if not link:
            link = ReportProblemLink(
                report_id=report.id,
                problem_id=target_problem.id,
                confidence=1.0,
                status="confirmed",
                confirmed_at=utc_now(),
                confirmed_by_user_id=user.id,
            )
            self.db.add(link)
        else:
            link.status = "confirmed"
            link.confirmed_at = utc_now()
            link.confirmed_by_user_id = user.id

        self.db.commit()

        # Przeliczamy liczbę unikalnych zgłaszających (unique reporters)
        unique_reporters = self.calculate_unique_reporters(target_problem.id)
        target_problem.reporter_count = unique_reporters
        self.db.commit()
        self.db.refresh(target_problem)

        return CanonicalProblemResponse(
            id=target_problem.id,
            title=target_problem.title,
            generated_description=target_problem.generated_description,
            reporter_count=target_problem.reporter_count,
            location_centroid_lat=target_problem.location_centroid_lat,
            location_centroid_lon=target_problem.location_centroid_lon,
            status=target_problem.status,
            recurrence_recommended=target_problem.recurrence_recommended,
            created_at=target_problem.created_at,
        )

    def calculate_unique_reporters(self, problem_id: int) -> int:
        """Counts unique users that reported this problem.
        Prevents repeated submissions by one account from inflating counts.
        """
        count = self.db.execute(
            select(func.count(distinct(Report.author_id)))
            .where(Report.canonical_problem_id == problem_id)
        ).scalar()
        return count or 1

from src.utils.datetime_utils import utc_now
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.config import settings
from src.models.user import User
from src.models.report import Report
from src.models.problem import CanonicalProblem, ReportProblemLink
from src.schemas.matchmaking import (
    ReportCreateRequest,
    ReportResponse,
    ReportSubmissionResult,
    ProblemCandidateResponse,
)
from src.adapters.ai_gateway import get_ai_gateway
from src.adapters.vector_repository import VectorRepositoryAdapter
from src.services.geo_location_service import EntityGeoLocationService

SIMULATED_URGENT_GUIDANCE = (
    "UWAGA: Zgłoszenie zostało sklasyfikowane jako potencjalnie pilne lub zagrażające bezpieczeństwu. "
    "To jest środowisko prototypowe HUBMI z SYMULOWANYM przekazywaniem zgłoszeń. "
    "W rzeczywistym zagrożeniu życia, zdrowia lub mienia należy bezzwłocznie zadzwonić pod numer alarmowy 112 "
    "lub skontaktować się z Wojewódzkim Centrum Zarządzania Kryzysowego w Krakowie."
)

class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.ai = get_ai_gateway()
        self.vector_repo = VectorRepositoryAdapter(db)
        self.geo_locations = EntityGeoLocationService(db)

    def validate_malopolska_location(self, lat: float, lon: float) -> None:
        """Enforces geographic scope: Only problems within Małopolska are accepted."""
        in_lat = settings.MALOPOLSKA_MIN_LAT <= lat <= settings.MALOPOLSKA_MAX_LAT
        in_lon = settings.MALOPOLSKA_MIN_LON <= lon <= settings.MALOPOLSKA_MAX_LON
        if not (in_lat and in_lon):
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Podana lokalizacja ({lat:.4f}, {lon:.4f}) znajduje się poza terenem Województwa Małopolskiego. "
                    "Prototyp HUBMI obsługuje wyłącznie zgłoszenia z obszaru Małopolski."
                ),
            )

    def submit_report(self, data: ReportCreateRequest, user: User) -> ReportSubmissionResult:
        # 1. Location validation
        self.validate_malopolska_location(data.location_lat, data.location_lon)

        # 2. AI Classification & Urgency check
        classification = self.ai.classify_report(data.text)
        if classification.needs_revision:
            raise HTTPException(
                status_code=422,
                detail=classification.revision_reason or "Opis wymaga uzupełnienia przed przetworzeniem.",
            )

        # Persist and index only the HyDE-edited need. The user's free-form input is
        # used as transient context for the model and is never written as the canonical
        # report text or vector record.
        hyde_result = self.ai.generate_hyde_and_embedding(data.text, classification.categories)
        edited_need = hyde_result.generated_description.strip() or data.text.strip()

        # 3. Create Report in DB with ~30 days retention expiry
        expires_at = utc_now() + timedelta(days=settings.REPORT_EXPIRY_DAYS)
        report = Report(
            author_id=user.id,
            text_raw=edited_need,
            location_lat=data.location_lat,
            location_lon=data.location_lon,
            location_type=data.location_type,
            location_name=data.location_name or "Małopolska",
            categories=classification.categories,
            audience=classification.audience,
            urgency=classification.urgency,
            duration=classification.duration,
            is_urgent=classification.is_urgent,
            status="submitted",
            created_at=utc_now(),
            expires_at=expires_at,
        )
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        # Keep the map projection separate from the raw report table, while retaining
        # its exact WGS84 point for the author/admin projection.
        self.geo_locations.persist_report(report)
        self.db.commit()

        # The edited HyDE text is embedded first and only becomes a public aggregate after
        # the reporter explicitly confirms grouping.
        self.vector_repo.upsert_vector_record(
            entity_type="report",
            entity_id=report.id,
            embedding=hyde_result.embedding,
        )

        # Every accepted report belongs to one canonical problem before it becomes
        # visible in the problem/solution workflow.  If Ollama has no existing
        # candidate, create the canonical problem from the edited HyDE text.
        problem = CanonicalProblem(
            title=edited_need[:120],
            generated_description=edited_need,
            reporter_count=1,
            location_centroid_lat=data.location_lat,
            location_centroid_lon=data.location_lon,
            status="active",
            created_at=utc_now(),
        )
        self.db.add(problem)
        self.db.flush()
        self.vector_repo.upsert_vector_record(
            entity_type="problem", entity_id=problem.id, embedding=hyde_result.embedding,
        )
        report.canonical_problem_id = problem.id
        report.status = "confirmed"
        self.db.add(ReportProblemLink(
            report_id=report.id, problem_id=problem.id, confidence=1.0,
            status="confirmed", confirmed_at=utc_now(), confirmed_by_user_id=None,
        ))
        self.geo_locations.persist_problem(problem)
        self.db.commit()

        # 4. Find problem candidates (semantic grouping suggestion)
        candidates = self.ai.find_problem_candidates(
            report_text=edited_need,
            lat=data.location_lat,
            lon=data.location_lon,
            categories=classification.categories,
        )

        candidate_responses = [
            ProblemCandidateResponse(
                problem_id=c.problem_id,
                title=c.title,
                confidence=c.confidence,
            )
            for c in candidates
        ]

        report_resp = self.project_report(report, viewer=user)
        return ReportSubmissionResult(
            report=report_resp,
            suggested_candidates=candidate_responses,
        )

    def update_categories(self, report_id: int, categories: List[str], user: User) -> ReportResponse:
        report = self.db.get(Report, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Zgłoszenie nie zostało odnalezione")
        if report.author_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Brak uprawnień do edycji tego zgłoszenia")

        report.categories = categories
        self.db.commit()
        self.db.refresh(report)
        return self.project_report(report, viewer=user)

    def get_report(self, report_id: int, user: User) -> ReportResponse:
        report = self.db.get(Report, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Zgłoszenie nie zostało odnalezione")
        if report.author_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Brak uprawnień do tego zgłoszenia")
        return self.project_report(report, viewer=user)

    def list_reports(self, user: User) -> List[ReportResponse]:
        statement = select(Report).order_by(Report.created_at.desc())
        if user.role != "admin":
            statement = statement.where(Report.author_id == user.id)
        reports = self.db.execute(statement).scalars().all()
        return [self.project_report(report, viewer=user) for report in reports]

    def project_report(self, report: Report, viewer: User) -> ReportResponse:
        """Projects report data enforcing anonymity rules:
        author_name is hidden for normal users, but visible to administrators.
        """
        show_author = (viewer.role == "admin") or (report.author_id == viewer.id)
        author_name = None
        if show_author:
            author = report.author or self.db.get(User, report.author_id)
            if author:
                author_name = f"{author.name} {author.surname}".strip()

        guidance = SIMULATED_URGENT_GUIDANCE if report.is_urgent else None

        return ReportResponse(
            id=report.id,
            text_raw=report.text_raw,
            location_lat=report.location_lat,
            location_lon=report.location_lon,
            location_type=report.location_type,
            location_name=report.location_name,
            categories=report.categories,
            audience=report.audience,
            urgency=report.urgency,
            duration=report.duration,
            is_urgent=report.is_urgent,
            status=report.status,
            canonical_problem_id=report.canonical_problem_id,
            created_at=report.created_at,
            expires_at=report.expires_at,
            author_name=author_name,
            urgent_guidance=guidance,
        )

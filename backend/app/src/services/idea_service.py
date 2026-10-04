from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.models.user import User
from src.models.idea import Idea, AIJob
from src.schemas.modules import (
    IdeaCreateRequest,
    IdeaResponse,
    IdeaAuthorConfirmRequest,
    AIJobStatusResponse,
)
from src.adapters.ai_gateway import get_ai_gateway
from src.adapters.vector_repository import VectorRepositoryAdapter
from src.models.source import SourceKnowledge, Solution
from src.models.problem import CanonicalProblem
from src.models.match import MatchResult
from src.services.geo_location_service import EntityGeoLocationService

class IdeaService:
    def __init__(self, db: Session):
        self.db = db
        self.ai = get_ai_gateway()
        self.vector_repo = VectorRepositoryAdapter(db)
        self.geo_locations = EntityGeoLocationService(db)

    def create_draft(self, data: IdeaCreateRequest, user: User) -> IdeaResponse:
        problem = self.db.get(CanonicalProblem, data.canonical_problem_id)
        if not problem or problem.status != "active":
            raise HTTPException(status_code=404, detail="Wskazany problem nie istnieje albo nie jest aktywny")
        idea = Idea(
            author_id=user.id,
            canonical_problem_id=problem.id,
            text_raw=data.text_raw,
            need=data.need,
            beneficiaries=data.beneficiaries,
            solution=data.solution,
            partners=data.partners,
            costs=data.costs,
            resources=data.resources,
            stages=data.stages,
            status="private_draft",
            created_at=utc_now(),
        )
        self.db.add(idea)
        self.db.commit()
        self.db.refresh(idea)
        return self._project_idea(idea, user)

    def submit_to_ai_queue(self, idea_id: int, user: User) -> AIJobStatusResponse:
        idea = self.db.get(Idea, idea_id)
        if not idea:
            raise HTTPException(status_code=404, detail="Pomysł nie został odnaleziony")
        if idea.author_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Brak uprawnień do tego pomysłu")

        idea.status = "queued"
        
        job = AIJob(
            entity_type="idea",
            entity_id=idea.id,
            job_type="refine_idea",
            status="pending",
            created_at=utc_now(),
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        # Trigger processing (synchronous execution or queued in background worker)
        self.process_job(job.id)
        self.db.refresh(job)

        return AIJobStatusResponse(
            job_id=job.id,
            entity_type=job.entity_type,
            entity_id=job.entity_id,
            job_type=job.job_type,
            status=job.status,
            attempt_count=job.attempt_count,
            last_error=job.last_error,
            created_at=job.created_at,
            processed_at=job.processed_at,
        )

    def process_job(self, job_id: int) -> None:
        job = self.db.get(AIJob, job_id)
        if not job:
            return

        job.status = "processing"
        job.attempt_count += 1
        self.db.commit()

        try:
            idea = self.db.get(Idea, job.entity_id)
            if not idea:
                raise ValueError("Idea record not found")

            refined = self.ai.refine_idea(idea.text_raw)
            idea.text_refined = refined.text_refined
            idea.need = refined.need
            idea.beneficiaries = refined.beneficiaries
            idea.solution = refined.solution
            idea.partners = refined.partners
            idea.costs = refined.costs
            idea.resources = refined.resources
            idea.stages = refined.stages
            idea.status = "pending_author"

            job.status = "done"
            job.processed_at = utc_now()
            self.db.commit()
        except Exception as exc:
            self.db.rollback()
            job = self.db.get(AIJob, job_id)
            if job:
                job.status = "failed"
                job.last_error = str(exc)
                # IMPORTANT: Outage must NOT bypass AI processing or publication gates
                # The idea remains in 'queued' status, waiting for retry.
                self.db.commit()

    def author_confirm(self, idea_id: int, data: IdeaAuthorConfirmRequest, user: User) -> IdeaResponse:
        idea = self.db.get(Idea, idea_id)
        if not idea:
            raise HTTPException(status_code=404, detail="Pomysł nie został odnaleziony")
        if idea.author_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Tylko autor może zatwierdzić przetworzony pomysł")
        if idea.status != "pending_author":
            raise HTTPException(
                status_code=400,
                detail=f"Nie można zatwierdzić pomysłu w stanie '{idea.status}'. Wymagany stan: 'pending_author'."
            )

        idea.text_refined = data.text_refined
        idea.need = data.need
        idea.beneficiaries = data.beneficiaries
        idea.solution = data.solution
        idea.partners = data.partners
        idea.costs = data.costs
        idea.resources = data.resources
        idea.stages = data.stages
        idea.status = "pending_admin"
        self.db.commit()
        self.db.refresh(idea)
        embedding = self.ai.generate_hyde_and_embedding(
            idea.text_refined or idea.text_raw,
            ["Pomysł użytkownika"],
        ).embedding
        self.vector_repo.upsert_vector_record("idea", idea.id, embedding)
        return self._project_idea(idea, user)

    def admin_approve(self, idea_id: int, admin_user: User) -> IdeaResponse:
        if admin_user.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")
        
        idea = self.db.get(Idea, idea_id)
        if not idea:
            raise HTTPException(status_code=404, detail="Pomysł nie został odnaleziony")
        if idea.status != "pending_admin":
            raise HTTPException(
                status_code=400,
                detail=f"Nie można opublikować pomysłu w stanie '{idea.status}'. Wymagany stan: 'pending_admin'."
            )

        idea.status = "public"
        source = SourceKnowledge(
            source_url=f"user-idea://{idea.id}",
            title=idea.text_refined or idea.text_raw[:120],
            content_summary=idea.solution or idea.text_refined or idea.text_raw,
            category="Pomysł użytkownika",
            provenance_metadata={"idea_id": idea.id, "status": "approved"},
        )
        self.db.add(source)
        self.db.flush()
        solution = Solution(
            source_knowledge_id=source.id,
            title=idea.text_refined or idea.text_raw[:120],
            description=idea.solution or idea.text_refined or idea.text_raw,
            target_audience=idea.beneficiaries or "Do określenia",
            cost_estimate=idea.costs or "Nie zadeklarowano",
            limitations="Pomysł użytkownika wymaga lokalnej weryfikacji i decyzji o pilotażu.",
        )
        self.db.add(solution)
        self.db.commit()
        self.db.refresh(idea)
        self.db.refresh(solution)
        self.db.add(MatchResult(
            problem_id=idea.canonical_problem_id,
            solution_id=solution.id,
            rank=1,
            score=1.0,
            explanation="Pomysł użytkownika przypisany do wybranego problemu.",
            limitations="Wymaga lokalnej weryfikacji przed pilotażem.",
            coord_x=0.0,
            coord_y=0.0,
            coord_z=0.0,
        ))
        self.geo_locations.persist_innovation(solution)
        self.db.commit()
        idea_vector = self.vector_repo.get_vector_record("idea", idea.id)
        if idea_vector:
            self.vector_repo.upsert_vector_record("problem", problem.id, idea_vector.embedding)
            self.vector_repo.upsert_vector_record("solution", solution.id, idea_vector.embedding)
        return self._project_idea(idea, admin_user)

    def get_public_ideas(self) -> List[IdeaResponse]:
        ideas = self.db.execute(
            select(Idea).where(Idea.status == "public").order_by(Idea.created_at.desc())
        ).scalars().all()
        # Public view masks author identity unless viewer is admin
        return [
            IdeaResponse(
                id=i.id,
                author_id=i.author_id,
                canonical_problem_id=i.canonical_problem_id,
                text_raw=i.text_raw,
                text_refined=i.text_refined,
                need=i.need,
                beneficiaries=i.beneficiaries,
                solution=i.solution,
                partners=i.partners,
                costs=i.costs,
                resources=i.resources,
                stages=i.stages,
                status=i.status,
                created_at=i.created_at,
                author_name=None,
            )
            for i in ideas
        ]

    def get_idea(self, idea_id: int, viewer: User) -> IdeaResponse:
        """Read one idea without exposing a private draft to another account."""
        idea = self.db.get(Idea, idea_id)
        if not idea:
            raise HTTPException(status_code=404, detail="Pomysł nie został odnaleziony")
        if idea.status != "public" and idea.author_id != viewer.id and viewer.role != "admin":
            # A private draft should not reveal its existence, title, or lifecycle to another user.
            raise HTTPException(status_code=404, detail="Pomysł nie został odnaleziony")
        return self._project_idea(idea, viewer)

    def list_my_ideas(self, viewer: User) -> List[IdeaResponse]:
        ideas = self.db.execute(
            select(Idea)
            .where(Idea.author_id == viewer.id)
            .order_by(Idea.created_at.desc())
        ).scalars().all()
        return [self._project_idea(idea, viewer) for idea in ideas]

    def list_admin_ideas(self, admin: User) -> List[IdeaResponse]:
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Wymagane uprawnienia administratora")
        ideas = self.db.execute(
            select(Idea).order_by(Idea.created_at.desc())
        ).scalars().all()
        return [self._project_idea(idea, admin) for idea in ideas]

    def _project_idea(self, idea: Idea, viewer: User) -> IdeaResponse:
        show_author = (viewer.role == "admin") or (idea.author_id == viewer.id)
        author_name = "Autor pomysłu" if show_author else None
        return IdeaResponse(
            id=idea.id,
            author_id=idea.author_id,
            canonical_problem_id=idea.canonical_problem_id,
            text_raw=idea.text_raw,
            text_refined=idea.text_refined,
            need=idea.need,
            beneficiaries=idea.beneficiaries,
            solution=idea.solution,
            partners=idea.partners,
            costs=idea.costs,
            resources=idea.resources,
            stages=idea.stages,
            status=idea.status,
            created_at=idea.created_at,
            author_name=author_name,
        )

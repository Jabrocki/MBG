from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.models.user import User
from src.models.idea import Idea
from src.models.discussion import DiscussionThread, ThreadMessage, Notification
from src.models.adaptation import InstitutionAdaptation
from src.models.source import Solution
from src.schemas.modules import (
    DiscussionThreadResponse,
    ThreadMessageResponse,
    ThreadMessageCreateRequest,
    NotificationResponse,
    InstitutionAdaptationRequest,
    InstitutionAdaptationResponse,
)
from src.adapters.ai_gateway import get_ai_gateway

class DiscussionService:
    def __init__(self, db: Session):
        self.db = db
        self.ai = get_ai_gateway()

    def get_or_create_thread_for_idea(self, idea_id: int, viewer: User) -> DiscussionThreadResponse:
        idea = self.db.get(Idea, idea_id)
        if not idea:
            raise HTTPException(status_code=404, detail="Pomysł nie został odnaleziony")
        self._ensure_idea_visible(idea, viewer)

        thread = self.db.execute(
            select(DiscussionThread).where(DiscussionThread.idea_id == idea_id)
        ).scalar_one_or_none()

        if not thread:
            thread = DiscussionThread(
                idea_id=idea_id,
                title=f"Dyskusja: {idea.text_raw[:50]}",
                created_at=utc_now(),
            )
            self.db.add(thread)
            self.db.commit()
            self.db.refresh(thread)

        return self._project_thread(thread)

    def post_message(self, thread_id: int, data: ThreadMessageCreateRequest, author: User) -> ThreadMessageResponse:
        thread = self.db.get(DiscussionThread, thread_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Wątek nie został odnaleziony")
        self._ensure_idea_visible(thread.idea, author)

        msg = ThreadMessage(
            thread_id=thread_id,
            author_id=author.id,
            content=data.content,
            created_at=utc_now(),
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)

        author_name = f"{author.name} {author.surname}".strip()
        return ThreadMessageResponse(
            id=msg.id,
            thread_id=msg.thread_id,
            author_id=msg.author_id,
            author_name=author_name,
            content=msg.content,
            created_at=msg.created_at,
        )

    def get_user_notifications(self, user: User) -> List[NotificationResponse]:
        notifs = self.db.execute(
            select(Notification)
            .where(Notification.user_id == user.id)
            .order_by(Notification.created_at.desc())
        ).scalars().all()

        return [
            NotificationResponse(
                id=n.id,
                title=n.title,
                message=n.message,
                link=n.link,
                is_read=n.is_read,
                created_at=n.created_at,
            )
            for n in notifs
        ]

    def mark_notification_read(self, notif_id: int, user: User) -> None:
        notif = self.db.get(Notification, notif_id)
        if notif and notif.user_id == user.id:
            notif.is_read = True
            self.db.commit()

    def create_adaptation_draft(self, data: InstitutionAdaptationRequest, user: User) -> InstitutionAdaptationResponse:
        sol = self.db.get(Solution, data.solution_id)
        if not sol:
            raise HTTPException(status_code=404, detail="Innowacja źródłowa nie została odnaleziona")

        draft = self.ai.adapt_institution_innovation(
            solution_title=sol.title,
            solution_description=sol.description,
            beneficiaries=data.beneficiaries,
            location=data.location,
            resources=data.resources,
            budget=data.budget,
            constraints=data.constraints,
        )

        adaptation = InstitutionAdaptation(
            user_id=user.id,
            solution_id=data.solution_id,
            beneficiaries=data.beneficiaries,
            location=data.location,
            resources=data.resources,
            budget=data.budget,
            constraints=data.constraints,
            draft_adaptation=draft,
            created_at=utc_now(),
        )
        self.db.add(adaptation)
        self.db.commit()
        self.db.refresh(adaptation)

        return self._project_adaptation(adaptation)

    def list_adaptations(self, viewer: User) -> List[InstitutionAdaptationResponse]:
        statement = select(InstitutionAdaptation).order_by(InstitutionAdaptation.created_at.desc())
        if viewer.role != "admin":
            statement = statement.where(InstitutionAdaptation.user_id == viewer.id)
        adaptations = self.db.execute(statement).scalars().all()
        return [self._project_adaptation(adaptation) for adaptation in adaptations]

    def get_adaptation(self, adaptation_id: int, viewer: User) -> InstitutionAdaptationResponse:
        adaptation = self.db.get(InstitutionAdaptation, adaptation_id)
        if not adaptation:
            raise HTTPException(status_code=404, detail="Adaptacja nie została odnaleziona")
        if adaptation.user_id != viewer.id and viewer.role != "admin":
            raise HTTPException(status_code=403, detail="Brak uprawnień do tej adaptacji")
        return self._project_adaptation(adaptation)

    def _project_thread(self, thread: DiscussionThread) -> DiscussionThreadResponse:
        messages = []
        for m in thread.messages:
            author_name = f"{m.author.name} {m.author.surname}".strip() if m.author else "Użytkownik"
            messages.append(
                ThreadMessageResponse(
                    id=m.id,
                    thread_id=m.thread_id,
                    author_id=m.author_id,
                    author_name=author_name,
                    content=m.content,
                    created_at=m.created_at,
                )
            )

        return DiscussionThreadResponse(
            id=thread.id,
            idea_id=thread.idea_id,
            title=thread.title,
            created_at=thread.created_at,
            messages=messages,
        )

    @staticmethod
    def _ensure_idea_visible(idea: Idea, viewer: User) -> None:
        if idea.status != "public" and idea.author_id != viewer.id and viewer.role != "admin":
            raise HTTPException(status_code=404, detail="Pomysł nie został odnaleziony")

    @staticmethod
    def _project_adaptation(adaptation: InstitutionAdaptation) -> InstitutionAdaptationResponse:
        solution = adaptation.solution
        source = solution.source_knowledge if solution and solution.source_knowledge else None
        return InstitutionAdaptationResponse(
            id=adaptation.id,
            user_id=adaptation.user_id,
            solution_id=adaptation.solution_id,
            beneficiaries=adaptation.beneficiaries,
            location=adaptation.location,
            resources=adaptation.resources,
            budget=adaptation.budget,
            constraints=adaptation.constraints,
            draft_adaptation=adaptation.draft_adaptation,
            solution_title=solution.title if solution else None,
            source_url=source.source_url if source else None,
            created_at=adaptation.created_at,
        )

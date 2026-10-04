from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.schemas.modules import (
    DiscussionThreadResponse,
    ThreadMessageResponse,
    ThreadMessageCreateRequest,
    NotificationResponse,
    InstitutionAdaptationRequest,
    InstitutionAdaptationResponse,
    AIDiscussionRequest,
)
from src.services.discussion_service import DiscussionService

router = APIRouter(tags=["Dyskusje, Powiadomienia i Adaptacje instytucjonalne"])

@router.get("/ideas/{idea_id}/thread", response_model=DiscussionThreadResponse, summary="Wątek dyskusyjny przypisany do pomysłu")
def get_idea_thread(
    idea_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiscussionService(db)
    return service.get_or_create_thread_for_idea(idea_id, current_user)

@router.post("/threads/{thread_id}/messages", response_model=ThreadMessageResponse, summary="Wysłanie wiadomości w wątku dyskusyjnym")
def post_thread_message(
    thread_id: int,
    data: ThreadMessageCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiscussionService(db)
    return service.post_message(thread_id, data, current_user)

@router.post("/threads/{thread_id}/ai", response_model=ThreadMessageResponse, summary="Odpowiedź Ollamy w wątku jednego pomysłu")
def post_ai_thread_message(
    thread_id: int,
    data: AIDiscussionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DiscussionService(db).post_ai_message(thread_id, data.content, current_user)

@router.get("/notifications", response_model=List[NotificationResponse], summary="In-app powiadomienia dla bieżącego użytkownika")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiscussionService(db)
    return service.get_user_notifications(current_user)

@router.post("/notifications/{notif_id}/read", summary="Oznaczenie powiadomienia jako przeczytane")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiscussionService(db)
    service.mark_notification_read(notif_id, current_user)
    return {"status": "ok"}

@router.post("/adaptations", response_model=InstitutionAdaptationResponse, summary="Formularz adaptacji innowacji przez instytucję")
def create_adaptation(
    data: InstitutionAdaptationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiscussionService(db)
    return service.create_adaptation_draft(data, current_user)


@router.get("/adaptations/mine", response_model=List[InstitutionAdaptationResponse], summary="Własne szkice adaptacji; administrator widzi wszystkie")
def list_adaptations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DiscussionService(db).list_adaptations(current_user)


@router.get("/adaptations/{adaptation_id}", response_model=InstitutionAdaptationResponse, summary="Szczegóły własnej adaptacji")
def get_adaptation(
    adaptation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return DiscussionService(db).get_adaptation(adaptation_id, current_user)

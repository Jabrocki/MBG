from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user, require_admin
from src.models.user import User
from src.schemas.modules import (
    IdeaCreateRequest,
    IdeaResponse,
    IdeaAuthorConfirmRequest,
    AIJobStatusResponse,
)
from src.services.idea_service import IdeaService

router = APIRouter(prefix="/ideas", tags=["Kreator pomysłów"])


@router.get("/mine", response_model=List[IdeaResponse], summary="Prywatna lista pomysłów bieżącego użytkownika")
def get_my_ideas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return IdeaService(db).list_my_ideas(current_user)


@router.get("/public", response_model=List[IdeaResponse], summary="Lista opublikowanych pomysłów poddanych dyskusji")
def get_public_ideas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return IdeaService(db).get_public_ideas()


@router.get("/admin/list", response_model=List[IdeaResponse], summary="Pełna kolejka pomysłów dla administratora")
def get_admin_ideas(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return IdeaService(db).list_admin_ideas(admin_user)

@router.post("", response_model=IdeaResponse, summary="Utworzenie wersji roboczej pomysłu")
def create_idea_draft(
    data: IdeaCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = IdeaService(db)
    return service.create_draft(data, current_user)

@router.post("/{idea_id}/submit", response_model=AIJobStatusResponse, summary="Przekazanie pomysłu do kolejki przetwarzania AI")
def submit_idea_to_ai(
    idea_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = IdeaService(db)
    return service.submit_to_ai_queue(idea_id, current_user)

@router.post("/{idea_id}/author-confirm", response_model=IdeaResponse, summary="Potwierdzenie ustrukturyzowanego pomysłu przez autora")
def author_confirm_idea(
    idea_id: int,
    data: IdeaAuthorConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = IdeaService(db)
    return service.author_confirm(idea_id, data, current_user)

@router.post("/{idea_id}/admin-approve", response_model=IdeaResponse, summary="Zatwierdzenie publikacji pomysłu przez administratora")
def admin_approve_idea(
    idea_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    service = IdeaService(db)
    return service.admin_approve(idea_id, admin_user)

@router.get("/{idea_id}", response_model=IdeaResponse, summary="Szczegóły pomysłu autora, administratora albo pomysłu publicznego")
def get_idea(
    idea_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return IdeaService(db).get_idea(idea_id, current_user)

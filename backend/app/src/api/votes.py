from typing import List
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.schemas.modules import (
    VoteCreateRequest,
    VoteResponse,
    SwipeCardResponse,
)
from src.services.vote_service import VoteService

router = APIRouter(prefix="/votes", tags=["Głosowanie społecznościowe (Swipe cards)"])

@router.get("/cards", response_model=List[SwipeCardResponse], summary="Karty rozwiązań do głosowania dla danego problemu")
def get_cards_for_problem(
    problem_id: int = Query(..., description="ID problemu lokalnego"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = VoteService(db)
    return service.get_cards_for_problem(problem_id, current_user)

@router.post("", response_model=VoteResponse, summary="Oddanie lub zmiana głosu (Popieram / Pomijam)")
def cast_vote(
    data: VoteCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = VoteService(db)
    return service.cast_or_update_vote(data, current_user)

@router.delete("/{vote_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Cofnięcie oddanego głosu")
def undo_vote(
    vote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = VoteService(db)
    service.undo_vote(vote_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

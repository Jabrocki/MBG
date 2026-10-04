from typing import List
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user, require_admin
from src.models.user import User
from src.schemas.modules import (
    PilotCreateRequest,
    PilotTransitionRequest,
    PilotResponse,
    VolunteerResponse,
    SatisfactionFeedbackRequest,
    SatisfactionFeedbackResponse,
)
from src.services.pilot_service import PilotService

router = APIRouter(prefix="/pilots", tags=["Pilotaże i Wolontariat"])


@router.get("", response_model=List[PilotResponse], summary="Lista dostępnych pilotaży")
def list_pilots(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PilotService(db).list_pilots(current_user)


@router.get("/{pilot_id}", response_model=PilotResponse, summary="Szczegóły pilotażu wraz z bieżącym stanem udziału")
def get_pilot(
    pilot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PilotService(db).get_pilot(pilot_id, current_user)


@router.get("/{pilot_id}/volunteer", response_model=VolunteerResponse, summary="Stan własnego zgłoszenia do pilotażu")
def get_my_volunteer_registration(
    pilot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return PilotService(db).get_my_volunteer_registration(pilot_id, current_user)

@router.post("", response_model=PilotResponse, summary="Utworzenie inicjatywy pilotażowej (tylko administrator)")
def create_pilot(
    data: PilotCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    service = PilotService(db)
    return service.create_pilot(data, admin_user)

@router.post("/{pilot_id}/transition", response_model=PilotResponse, summary="Zmiana statusu cyklu życia pilota (tylko administrator)")
def transition_pilot_status(
    pilot_id: int,
    data: PilotTransitionRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    service = PilotService(db)
    return service.transition_status(pilot_id, data, admin_user)

@router.post("/{pilot_id}/volunteer", response_model=VolunteerResponse, summary="Zgłoszenie się jako wolontariusz do projektu")
def register_volunteer(
    pilot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PilotService(db)
    return service.register_volunteer(pilot_id, current_user)

@router.delete("/{pilot_id}/volunteer", status_code=status.HTTP_204_NO_CONTENT, summary="Rezygnacja z wolontariatu")
def cancel_volunteer(
    pilot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PilotService(db)
    service.cancel_volunteer(pilot_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{pilot_id}/accept-offer", response_model=VolunteerResponse, summary="Akceptacja zaoferowanego miejsca z listy oczekujących")
def accept_place_offer(
    pilot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PilotService(db)
    return service.accept_place_offer(pilot_id, current_user)

@router.post("/{pilot_id}/feedback", response_model=SatisfactionFeedbackResponse, summary="Ocena satysfakcji beneficjenta lub wolontariusza")
def submit_feedback(
    pilot_id: int,
    data: SatisfactionFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = PilotService(db)
    return service.add_satisfaction_feedback(pilot_id, data, current_user)

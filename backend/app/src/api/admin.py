from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, require_admin
from src.models.user import User
from src.schemas.matchmaking import CanonicalProblemResponse
from src.schemas.modules import (
    MergeProblemsRequest,
    SplitProblemRequest,
    MergeSolutionsRequest,
    VolunteerResponse,
)
from src.services.admin_service import AdminService
from src.services.pilot_service import PilotService
from src.services.retention_service import RetentionService

router = APIRouter(prefix="/admin", tags=["Panel Administratora"])

@router.post("/problems/merge", response_model=CanonicalProblemResponse, summary="Scalenie problemów kanonicznych z przeliczeniem unikalnych zgłaszających i głosów")
def merge_problems(
    data: MergeProblemsRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    service = AdminService(db)
    return service.merge_problems(data, admin_user)

@router.post("/problems/split", response_model=CanonicalProblemResponse, summary="Wydzielenie części zgłoszeń do nowego problemu kanonicznego")
def split_problem(
    data: SplitProblemRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    service = AdminService(db)
    return service.split_problem(data, admin_user)

@router.post("/solutions/merge", status_code=status.HTTP_204_NO_CONTENT, summary="Scalenie zduplikowanych rozwiązań")
def merge_solutions(
    data: MergeSolutionsRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    service = AdminService(db)
    service.merge_solutions(data, admin_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/pilots/{pilot_id}/promote-volunteer", response_model=VolunteerResponse, summary="Ręczna promocja wolontariusza z listy oczekujących")
def promote_volunteer(
    pilot_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    service = PilotService(db)
    return service.manual_promote_volunteer(pilot_id, user_id, admin_user)

@router.post("/retention/purge", summary="Uruchomienie procedury wygaszania surowych raportów po 30 dniach")
def purge_retention(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    service = RetentionService(db)
    deleted = service.purge_expired_reports()
    return {"status": "success", "deleted_expired_reports": deleted}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.schemas.matchmaking import (
    ReportCreateRequest,
    CategoryCorrectionRequest,
    ReportResponse,
    ReportSubmissionResult,
    ConfirmGroupingRequest,
    CanonicalProblemResponse,
)
from src.services.report_service import ReportService
from src.services.grouping_service import GroupingService

router = APIRouter(prefix="/reports", tags=["Zgłoszenia problemów"])

@router.post("", response_model=ReportSubmissionResult, summary="Zgłoszenie problemu społecznego")
def submit_report(
    data: ReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    return service.submit_report(data, current_user)

@router.patch("/{report_id}/categories", response_model=ReportResponse, summary="Korekta kategorii przez użytkownika")
def update_categories(
    report_id: int,
    data: CategoryCorrectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    return service.update_categories(report_id, data.categories, current_user)

@router.post("/{report_id}/confirm-grouping", response_model=CanonicalProblemResponse, summary="Potwierdzenie przypisania do problemu lub utworzenie nowego")
def confirm_grouping(
    report_id: int,
    data: ConfirmGroupingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = GroupingService(db)
    return service.confirm_grouping(report_id, data, current_user)

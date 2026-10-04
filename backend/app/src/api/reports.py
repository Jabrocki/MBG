from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.schemas.matchmaking import (
    ReportCreateRequest,
    CategoryCorrectionRequest,
    ReportDetailsUpdateRequest,
    ReportResponse,
    ReportSubmissionResult,
    ConfirmGroupingRequest,
    CanonicalProblemResponse,
    ReportListResponse,
)
from src.services.report_service import ReportService
from src.services.grouping_service import GroupingService

router = APIRouter(prefix="/reports", tags=["Zgłoszenia problemów"])

@router.get("", response_model=ReportListResponse, summary="Lista własnych zgłoszeń; administrator widzi wszystkie")
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    return {"reports": service.list_reports(current_user)}

@router.get("/{report_id}", response_model=ReportResponse, summary="Szczegóły własnego zgłoszenia")
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ReportService(db)
    return service.get_report(report_id, current_user)

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

@router.patch("/{report_id}/details", response_model=ReportResponse, summary="Edycja odbiorców i pilności zgłoszenia")
def update_details(
    report_id: int,
    data: ReportDetailsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ReportService(db).update_details(report_id, data.audience, data.urgency, current_user)

@router.post("/{report_id}/confirm-grouping", response_model=CanonicalProblemResponse, summary="Potwierdzenie przypisania do problemu lub utworzenie nowego")
def confirm_grouping(
    report_id: int,
    data: ConfirmGroupingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = GroupingService(db)
    return service.confirm_grouping(report_id, data, current_user)

from typing import List
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, require_admin
from src.models.user import User
from src.schemas.modules import (
    AdminDashboardCountsResponse,
    AdminCatalogueCreateRequest,
    AdminCatalogueUpdateRequest,
    AdminReportStatusRequest,
    MergeProblemsRequest,
    SplitProblemRequest,
    MergeSolutionsRequest,
    VolunteerResponse,
)
from src.schemas.matchmaking import CanonicalProblemResponse, ReportResponse
from src.services.admin_service import AdminService
from src.services.pilot_service import PilotService
from src.services.retention_service import RetentionService

router = APIRouter(prefix="/admin", tags=["Panel Administratora"])


@router.get("/dashboard", response_model=AdminDashboardCountsResponse, summary="Liczby na pulpicie administratora obliczane z bazy")
def get_dashboard_counts(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return AdminService(db).get_dashboard_counts(admin_user)


@router.get("/problems", response_model=List[CanonicalProblemResponse], summary="Lista problemów kanonicznych dla administratora")
def list_problems(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return AdminService(db).list_problems(admin_user)


@router.patch("/reports/{report_id}/status", response_model=ReportResponse, summary="Zmiana statusu zgłoszenia przez administratora")
def update_report_status(
    report_id: int,
    data: AdminReportStatusRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return AdminService(db).update_report_status(report_id, data.status, admin_user)

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


@router.post("/catalogue", summary="Dodanie innowacji do katalogu")
def create_catalogue_item(
    data: AdminCatalogueCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return AdminService(db).create_catalogue_item(data, admin_user)


@router.patch("/catalogue/{solution_id}", summary="Edycja innowacji w katalogu")
def update_catalogue_item(
    solution_id: int,
    data: AdminCatalogueUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return AdminService(db).update_catalogue_item(solution_id, data, admin_user)


@router.delete("/catalogue/{solution_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Usunięcie innowacji z katalogu")
def delete_catalogue_item(
    solution_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    AdminService(db).delete_catalogue_item(solution_id, admin_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/pilots/{pilot_id}/volunteers", response_model=List[VolunteerResponse], summary="Lista wolontariuszy pilotażu")
def list_pilot_volunteers(
    pilot_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    return PilotService(db).list_volunteers(pilot_id, admin_user)

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

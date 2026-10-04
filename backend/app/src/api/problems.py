from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.schemas.matchmaking import (
    MatchListResponse,
    CoordinatesResponse,
    CanonicalProblemResponse,
)
from src.services.matching_service import MatchingService
from src.services.catalogue_service import CatalogueService
from src.adapters.ai_gateway import get_ai_gateway
from src.models.problem import CanonicalProblem

router = APIRouter(prefix="/problems", tags=["Problemy kanoniczne i Matchmaking"])

@router.get("/nearby", response_model=List[CanonicalProblemResponse], summary="Odkrywanie problemów w wybranym promieniu geograficznym")
def get_nearby_problems(
    lat: float = Query(..., description="Szerokość geograficzna użytkownika"),
    lon: float = Query(..., description="Długość geograficzna użytkownika"),
    radius_km: float = Query(15.0, description="Promień odkrywania w kilometrach"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = CatalogueService(db)
    return service.get_nearby_problems(lat=lat, lon=lon, radius_km=radius_km)


@router.get("/{problem_id}", response_model=CanonicalProblemResponse, summary="Szczegóły problemu kanonicznego")
def get_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CatalogueService(db).get_problem(problem_id)

@router.get("/{problem_id}/matches", response_model=MatchListResponse, summary="Dopasowane innowacje społeczne (do 10 wyników)")
def get_problem_matches(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = MatchingService(db)
    return service.get_matches_for_problem(problem_id)

@router.get("/{problem_id}/ai-proposal", summary="Propozycja Ollamy na podstawie problemu i najbliższych innowacji")
def get_ai_proposal(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    problem = db.get(CanonicalProblem, problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem nie został odnaleziony")
    matches = MatchingService(db).get_matches_for_problem(problem_id).matches[:3]
    context = "; ".join(f"{match.title}: {match.description[:600]}" for match in matches)
    proposal = get_ai_gateway().discuss_idea(
        problem.generated_description,
        f"Najbliższe sprawdzone innowacje: {context}",
        "Zaproponuj jedno krótkie, konkretne rozwiązanie problemu społecznego. "
        "Połącz tylko elementy, które rzeczywiście pasują do problemu i podanych innowacji. "
        "Nie wymyślaj ulic, adresów, tras, liczb ani potwierdzonych faktów lokalnych. "
        "Jeśli lokalizacja nie jest potwierdzona, użyj określenia obszar problemu. Odpowiedz po polsku w 2-3 zdaniach, bez nagłówków.",
    )
    return {"proposal": proposal, "based_on": [match.title for match in matches]}

@router.get("/{problem_id}/coordinates", response_model=CoordinatesResponse, summary="Współrzędne 3D dla wizualizacji semantycznej")
def get_problem_coordinates(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = MatchingService(db)
    return service.get_coordinates_for_problem(problem_id)

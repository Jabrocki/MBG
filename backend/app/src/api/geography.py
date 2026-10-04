from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.api.deps import get_current_user, get_db
from src.models.user import User
from src.schemas.matchmaking import MapMarkersResponse
from src.services.geography_service import GeographyService


router = APIRouter(prefix="/map", tags=["Mapa geograficzna"])


@router.get(
    "/markers",
    response_model=MapMarkersResponse,
    summary="Piny mapy: potrzeby zagregowane, własne zgłoszenia i innowacje z rozpoznaną lokalizacją",
)
def get_map_markers(
    lat: Optional[float] = Query(None, description="Szerokość geograficzna środka aktualnego widoku mapy"),
    lon: Optional[float] = Query(None, description="Długość geograficzna środka aktualnego widoku mapy"),
    radius_km: Optional[float] = Query(None, description="Promień filtrowania 0.1–100 km; bez środka zwraca wszystkie piny"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return GeographyService(db).get_markers(
        user=current_user,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
    )

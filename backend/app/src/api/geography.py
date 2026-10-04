from typing import Optional
from urllib.parse import quote
from urllib.request import Request, urlopen
import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.api.deps import get_current_user, get_db
from src.models.user import User
from src.schemas.matchmaking import MapMarkersResponse, LocalitySearchResult
from src.services.geography_service import GeographyService


router = APIRouter(prefix="/map", tags=["Mapa geograficzna"])

MALOPOLSKA_VIEWBOX = "18.7,50.7,22.0,49.0"  # west,north,east,south


@router.get("/localities", response_model=list[LocalitySearchResult], summary="Wyszukiwarka miejscowości Małopolski bez Google Maps")
def search_localities(query: str = Query(..., min_length=2, max_length=100)):
    """Use the public OpenStreetMap Nominatim gazetteer, never Google Maps."""
    request = Request(
        "https://nominatim.openstreetmap.org/search?" + "&".join([
            f"q={quote(query)}", "format=jsonv2", "addressdetails=1", "limit=8",
            f"viewbox={MALOPOLSKA_VIEWBOX}", "bounded=1",
        ]),
        headers={"User-Agent": "HUBMI/1.0 (open geodata locality picker)"},
    )
    try:
        with urlopen(request, timeout=5) as response:
            rows = json.load(response)
    except Exception:
        return []
    results: list[LocalitySearchResult] = []
    for row in rows:
        try:
            lat, lon = float(row["lat"]), float(row["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        if not (49.0 <= lat <= 50.7 and 18.7 <= lon <= 22.0):
            continue
        address = row.get("address") or {}
        if not any(address.get(key) for key in ("village", "town", "city", "municipality", "hamlet")):
            continue
        results.append(LocalitySearchResult(
            name=(address.get("village") or address.get("town") or address.get("city") or address.get("municipality") or address.get("hamlet") or query),
            latitude=lat,
            longitude=lon,
            display_name=row.get("display_name", query),
        ))
    return results


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

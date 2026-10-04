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

MALOPOLSKA_EXTENT = "18.7,49.0,22.0,50.7"  # xmin,ymin,xmax,ymax


@router.get("/localities", response_model=list[LocalitySearchResult], summary="Wyszukiwarka miejscowości Małopolski bez Google Maps")
def search_localities(query: str = Query(..., min_length=2, max_length=100)):
    """Use the ArcGIS World geocoder, never Google Maps or OSM tiles."""
    request = Request(
        "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?" + "&".join([
            f"singleLine={quote(query + ' Małopolska')}", "f=json", "maxLocations=8", "outFields=*",
            f"searchExtent={MALOPOLSKA_EXTENT}",
        ]),
        headers={"User-Agent": "HUBMI/1.0 (commercial map locality picker)"},
    )
    try:
        with urlopen(request, timeout=5) as response:
            rows = json.load(response)
    except Exception:
        return []
    results: list[LocalitySearchResult] = []
    for row in (rows.get("candidates") or []):
        try:
            lat, lon = float(row["location"]["y"]), float(row["location"]["x"])
        except (KeyError, TypeError, ValueError):
            continue
        if not (49.0 <= lat <= 50.7 and 18.7 <= lon <= 22.0):
            continue
        results.append(LocalitySearchResult(
            name=row.get("address", query),
            latitude=lat,
            longitude=lon,
            display_name=row.get("address", query),
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

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.services.catalogue_service import CatalogueService

router = APIRouter(prefix="/catalogue", tags=["Katalog innowacji"])

@router.get("", summary="Przeglądanie i wyszukiwanie w katalogu innowacji")
def search_catalogue(
    q: Optional[str] = Query(None, description="Fraza wyszukiwania"),
    category: Optional[str] = Query(None, description="Kategoria tematyczna"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = CatalogueService(db)
    return service.search_catalogue(query=q, category=category)

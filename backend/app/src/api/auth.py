from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.schemas.matchmaking import DemoLoginRequest, DemoTokenResponse, UserResponse
from src.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Uwierzytelnianie"])

@router.post("/demo", response_model=DemoTokenResponse, summary="Wybór syntetycznego konta demo (user/admin)")
def login_demo(data: DemoLoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        return service.login_demo(data.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

@router.get("/me", response_model=UserResponse, summary="Dane aktualnie zalogowanego użytkownika")
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        surname=current_user.surname,
        email=current_user.email,
        role=current_user.role,
        is_anonymous_by_default=current_user.is_anonymous_by_default,
    )

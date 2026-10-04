from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.api.deps import get_db, get_current_user, security
from src.models.user import User
from src.schemas.matchmaking import (
    DemoLoginRequest,
    DemoTokenResponse,
    PasswordLoginRequest,
    RegisterRequest,
    UserResponse,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    PasswordChangeRequest,
)
from fastapi.security import HTTPAuthorizationCredentials
from src.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Uwierzytelnianie"])

@router.post("/demo", response_model=DemoTokenResponse, summary="Wybór syntetycznego konta demo (user/admin)")
def login_demo(data: DemoLoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        return service.login_demo(data.role)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/register", response_model=DemoTokenResponse, status_code=status.HTTP_201_CREATED, summary="Rejestracja konta użytkownika")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        return service.register(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/login", response_model=DemoTokenResponse, summary="Logowanie e-mailem i hasłem")
def login(data: PasswordLoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        return service.login(data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

@router.post("/password-reset/request", summary="Wysłanie linku odzyskiwania hasła")
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    AuthService(db).request_password_reset(data.email)
    return {"message": "Jeśli konto istnieje, wysłaliśmy instrukcję na podany adres e-mail."}

@router.post("/password-reset/confirm", summary="Ustawienie nowego hasła z jednorazowego linku")
def confirm_password_reset(data: PasswordResetConfirmRequest, db: Session = Depends(get_db)):
    try:
        AuthService(db).confirm_password_reset(data.token, data.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return {"message": "Hasło zostało zmienione. Zaloguj się ponownie."}

@router.post("/password-change", summary="Zmiana hasła zalogowanego użytkownika")
def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        AuthService(db).change_password(current_user, data.current_password, data.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return {"message": "Hasło zostało zmienione."}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Unieważnienie bieżącej sesji")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ``current_user`` verifies the bearer token before it can be removed.
    AuthService(db).logout(credentials.credentials)

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

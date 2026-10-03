from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.db.session import SessionLocal, get_db
from src.models.user import User, DemoSession

security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wymagane uwierzytelnienie (brak tokenu sesji)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    session = db.execute(
        select(DemoSession).where(DemoSession.token == token)
    ).scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowa lub wygasła sesja",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Użytkownik powiązany z sesją nie istnieje",
        )
    return user

def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień administratora",
        )
    return current_user

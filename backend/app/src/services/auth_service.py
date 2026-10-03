from src.utils.datetime_utils import utc_now
import secrets
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from src.models.user import User, DemoSession
from src.schemas.matchmaking import DemoTokenResponse

DEMO_ACCOUNTS = {
    "user": {
        "email": "jan.kowalski@demo.hubmi.pl",
        "name": "Jan",
        "surname": "Kowalski",
        "role": "user",
        "is_anonymous_by_default": True
    },
    "admin": {
        "email": "admin.malopolska@demo.hubmi.pl",
        "name": "Anna",
        "surname": "Nowak (Administrator)",
        "role": "admin",
        "is_anonymous_by_default": False
    }
}

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def login_demo(self, role: str) -> DemoTokenResponse:
        role_key = role.lower()
        if role_key not in DEMO_ACCOUNTS:
            raise ValueError(f"Nieznana rola demo: '{role}'. Dostępne role: 'user', 'admin'")

        acc_data = DEMO_ACCOUNTS[role_key]
        user = self.db.execute(
            select(User).where(User.email == acc_data["email"])
        ).scalar_one_or_none()

        if not user:
            user = User(
                email=acc_data["email"],
                name=acc_data["name"],
                surname=acc_data["surname"],
                role=acc_data["role"],
                is_anonymous_by_default=acc_data["is_anonymous_by_default"],
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

        # Generate a secure session token
        token = secrets.token_hex(32)
        demo_session = DemoSession(
            token=token,
            user_id=user.id,
            created_at=utc_now()
        )
        self.db.add(demo_session)
        self.db.commit()

        return DemoTokenResponse(
            access_token=token,
            token_type="bearer",
            role=user.role,
            user_id=user.id,
            user_name=f"{user.name} {user.surname}".strip()
        )

import base64
import hashlib
import hmac
import re
from src.utils.datetime_utils import utc_now
import secrets
from sqlalchemy.orm import Session
from sqlalchemy import select
from src.models.user import User, DemoSession, LocalCredential
from src.schemas.matchmaking import DemoTokenResponse, PasswordLoginRequest, RegisterRequest
from src.config import settings

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
        if role_key == "admin" and not settings.ALLOW_DEMO_ADMIN_LOGIN:
            raise PermissionError("Konto administratora wymaga logowania e-mailem i hasłem.")

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

        return self._issue_session(user)

    def register(self, data: RegisterRequest) -> DemoTokenResponse:
        """Register a normal account and immediately issue its bearer session.

        The endpoint deliberately has no role field.  Administrator rights are assigned only by
        server configuration or a later privileged workflow.
        """
        email = self._normalize_email(data.email)
        self._validate_registration(data, email)
        existing = self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            raise ValueError("Konto z tym adresem e-mail już istnieje. Zaloguj się zamiast rejestrować ponownie.")

        user = User(
            email=email,
            name=data.name.strip(),
            surname=data.surname.strip(),
            role="user",
            is_anonymous_by_default=data.is_anonymous_by_default,
        )
        self.db.add(user)
        self.db.flush()
        self.db.add(LocalCredential(user_id=user.id, password_hash=self._hash_password(data.password)))
        self.db.commit()
        self.db.refresh(user)
        return self._issue_session(user)

    def login(self, data: PasswordLoginRequest) -> DemoTokenResponse:
        email = self._normalize_email(data.email)
        user = self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        credential = user.credential if user else None
        if not credential or not self._verify_password(data.password, credential.password_hash):
            # Do not reveal whether an address is registered.
            raise ValueError("Nieprawidłowy e-mail lub hasło.")
        return self._issue_session(user)

    def ensure_configured_test_admin(self) -> User | None:
        """Create/update the one deployment-provided test administrator.

        Blank settings intentionally do nothing, so source code never ships an administrator
        password.  This makes it safe to invoke during each application startup.
        """
        if not settings.TEST_ADMIN_EMAIL or not settings.TEST_ADMIN_PASSWORD:
            return None
        email = self._normalize_email(settings.TEST_ADMIN_EMAIL)
        user = self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
            user = User(
                email=email,
                name=settings.TEST_ADMIN_NAME.strip() or "Administrator",
                surname=settings.TEST_ADMIN_SURNAME.strip(),
                role="admin",
                is_anonymous_by_default=False,
            )
            self.db.add(user)
            self.db.flush()
        else:
            user.role = "admin"
            user.name = settings.TEST_ADMIN_NAME.strip() or user.name
            user.surname = settings.TEST_ADMIN_SURNAME.strip()
            user.is_anonymous_by_default = False

        credential = user.credential
        password_hash = self._hash_password(settings.TEST_ADMIN_PASSWORD)
        if credential:
            credential.password_hash = password_hash
        else:
            self.db.add(LocalCredential(user_id=user.id, password_hash=password_hash))
        self.db.commit()
        self.db.refresh(user)
        return user

    def logout(self, token: str) -> None:
        session = self.db.execute(select(DemoSession).where(DemoSession.token == token)).scalar_one_or_none()
        if session:
            self.db.delete(session)
            self.db.commit()

    def _issue_session(self, user: User) -> DemoTokenResponse:
        """Generate a high-entropy bearer token for a user authenticated by any supported flow."""
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

    @staticmethod
    def _normalize_email(value: str) -> str:
        return value.strip().lower()

    @staticmethod
    def _validate_registration(data: RegisterRequest, email: str) -> None:
        if not email or "@" not in email or email.startswith("@") or email.endswith("@"):
            raise ValueError("Podaj poprawny adres e-mail.")
        if not data.name.strip():
            raise ValueError("Podaj imię.")
        if len(data.password) < 10:
            raise ValueError("Hasło musi mieć co najmniej 10 znaków.")
        if not re.search(r"[A-Za-zĄ-Żąćęłńóśźż]", data.password) or not re.search(r"\d", data.password):
            raise ValueError("Hasło musi zawierać co najmniej jedną literę i cyfrę.")

    @staticmethod
    def _hash_password(password: str) -> str:
        iterations = 600_000
        salt = secrets.token_bytes(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return "$".join(
            (
                "pbkdf2_sha256",
                str(iterations),
                base64.urlsafe_b64encode(salt).decode("ascii"),
                base64.urlsafe_b64encode(digest).decode("ascii"),
            )
        )

    @staticmethod
    def _verify_password(password: str, encoded: str) -> bool:
        try:
            algorithm, raw_iterations, encoded_salt, expected = encoded.split("$", 3)
            if algorithm != "pbkdf2_sha256":
                return False
            iterations = int(raw_iterations)
            salt = base64.urlsafe_b64decode(encoded_salt.encode("ascii"))
            actual = base64.urlsafe_b64encode(
                hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
            ).decode("ascii")
            return hmac.compare_digest(actual, expected)
        except (ValueError, TypeError):
            return False

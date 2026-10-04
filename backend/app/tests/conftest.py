import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from src.main import app
from src.db.base import Base
from src.api.deps import get_db
from src.models.user import User
from src.models.source import SourceKnowledge, Solution
from src.models.problem import CanonicalProblem
from src.services.auth_service import AuthService
from src.config import settings

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(autouse=True)
def init_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    with TestingSessionLocal() as db:
        sk = SourceKnowledge(
            source_url="https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/bawita",
            title="Bawita - Bawialnia",
            content_summary="Opis",
            category="Seniorzy",
            provenance_metadata={}
        )
        db.add(sk)
        db.flush()

        sol1 = Solution(
            id=1,
            source_knowledge_id=sk.id,
            title="Bawita - Międzypokoleniowa Bawialnia",
            description="Opis innowacji Bawita",
            limitations="Wymaga koordynatora",
        )
        sol2 = Solution(
            id=2,
            source_knowledge_id=sk.id,
            title="Wolontariat Sąsiedzki",
            description="Opis wolontariatu sąsiedzkiego",
            limitations="Ograniczony zasięg",
        )
        db.add_all([sol1, sol2])
        db.add(CanonicalProblem(
            id=1,
            title="Przykładowy problem społeczny",
            generated_description="Problem używany przez testy cyklu pomysłu.",
            reporter_count=1,
            location_centroid_lat=50.0619,
            location_centroid_lon=19.9368,
            status="active",
        ))
        db.commit()
    yield

def _make_client():
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app, base_url="http://test")


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    c = _make_client()
    yield c

@pytest.fixture
def user_client() -> Generator[TestClient, None, None]:
    c = _make_client()
    with TestingSessionLocal() as db:
        service = AuthService(db)
        token_resp = service.login_demo("user")
        c.headers["Authorization"] = f"Bearer {token_resp.access_token}"
    yield c

@pytest.fixture
def admin_client(monkeypatch) -> Generator[TestClient, None, None]:
    # The public application never exposes one-click administrator access.  Existing workflow
    # tests still need a synthetic privileged session, so they enable it only inside this fixture.
    monkeypatch.setattr(settings, "ALLOW_DEMO_ADMIN_LOGIN", True)
    c = _make_client()
    with TestingSessionLocal() as db:
        service = AuthService(db)
        token_resp = service.login_demo("admin")
        c.headers["Authorization"] = f"Bearer {token_resp.access_token}"
    yield c

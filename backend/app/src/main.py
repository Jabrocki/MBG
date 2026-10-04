from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
from pathlib import Path
from sqlalchemy import select

from src.config import settings
from src.db.base import Base
from src.db.session import engine, SessionLocal
from src.api.router import api_router
from src.models.user import User
from src.models.source import SourceKnowledge, Solution
from src.models.problem import CanonicalProblem
from src.models.geo_location import EntityGeoLocation
from src.models.pilot import Pilot
from src.services.auth_service import AuthService, DEMO_ACCOUNTS
from src.services.geo_location_service import EntityGeoLocationService


def seed_indexed_solutions(db) -> None:
    """Make every locally embedded innovation selectable by the RAG matcher.

    The IDs deliberately mirror ``OllamaRagGateway`` so a retrieved vector always resolves to a
    relational Solution record with source text for the UI.
    """
    index_path = Path(settings.OLLAMA_INNOVATIONS_INDEX)
    if not index_path.is_absolute():
        index_path = Path(__file__).resolve().parents[1] / index_path
    if not index_path.exists():
        return
    rows = [json.loads(line) for line in index_path.read_text(encoding="utf-8").splitlines() if line]
    by_title = {row["title"]: row for row in rows}
    for solution_id, title in enumerate(sorted(by_title), start=1001):
        if db.get(Solution, solution_id):
            continue
        row = by_title[title]
        source = SourceKnowledge(
            source_url=f"local://{row['path']}",
            title=title,
            content_summary=row["content"][:1500],
            category="Katalog ROPS / syntetyczny",
            provenance_metadata={"path": row["path"], "embedding_id": row["id"]},
        )
        db.add(source)
        db.flush()
        db.add(Solution(
            id=solution_id,
            source_knowledge_id=source.id,
            title=title,
            description=row["content"][:4000],
            target_audience="Sprawdź opis źródłowy",
            limitations="Wymaga lokalnej weryfikacji warunków oraz źródła.",
        ))

def seed_initial_demo_data():
    """Initializes synthetic demo users and representative innovations if database is empty."""
    with SessionLocal() as db:
        # Seed demo users
        for key, acc in DEMO_ACCOUNTS.items():
            existing = db.execute(select(User).where(User.email == acc["email"])).scalar_one_or_none()
            if not existing:
                u = User(
                    name=acc["name"],
                    surname=acc["surname"],
                    email=acc["email"],
                    role=acc["role"],
                    is_anonymous_by_default=acc["is_anonymous_by_default"],
                )
                db.add(u)

        # Seed sample innovations from ROPS corpus
        existing_sol = db.execute(select(Solution)).scalars().first()
        if not existing_sol:
            sk1 = SourceKnowledge(
                source_url="https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/bawita",
                title="Bawita - międzypokoleniowa bawialnia społeczna",
                content_summary="Projekt integracji międzypokoleniowej łączący seniorów i dzieci w wieku przedszkolnym.",
                category="Seniorzy",
                provenance_metadata={"rok": "2022", "rejon": "Kraków"},
            )
            db.add(sk1)
            db.flush()

            sol1 = Solution(
                source_knowledge_id=sk1.id,
                title="Bawita - Międzypokoleniowa Bawialnia",
                description="Przestrzeń spotkań i opieki wytchnieniowej integrująca seniorów oraz rodziny z małymi dziećmi.",
                target_audience="Seniorzy, rodzice, małe dzieci",
                cost_estimate="Niski (współdzielenie lokalu biblioteki)",
                limitations="Wymaga koordynacji animatora lokalnego i przystosowanego lokalu bez barier architektonicznych.",
            )
            db.add(sol1)

            sk2 = SourceKnowledge(
                source_url="https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/agencja-pracy-incydentalnej",
                title="Agencja Pracy Incydentalnej dla osób z niepełnosprawnościami",
                content_summary="Model wsparcia w aktywizacji zawodowej dla osób ze szczególnymi potrzebami.",
                category="Dostępność",
                provenance_metadata={"rok": "2021", "rejon": "Tarnów"},
            )
            db.add(sk2)
            db.flush()

            sol2 = Solution(
                source_knowledge_id=sk2.id,
                title="Agencja Aktywizacji Incydentalnej",
                description="Elastyczny system krótkich zleceń i asystentury pracy dopasowany do możliwości psychofizycznych.",
                target_audience="Osoby z niepełnosprawnościami, lokalni przedsiębiorcy",
                cost_estimate="Średni (szkolenia mentorów)",
                limitations="Konieczność pozyskania zaangażowanych pracodawców partnerskich.",
            )
            db.add(sol2)

        seed_indexed_solutions(db)
        # The citizen-facing pilot list is backed exclusively by this persisted record. It is
        # created only for an empty deployment, so administrator-created pilots are never replaced.
        existing_pilot = db.execute(select(Pilot).limit(1)).scalar_one_or_none()
        if not existing_pilot:
            source_solution = db.execute(select(Solution).order_by(Solution.id)).scalars().first()
            db.add(
                Pilot(
                    solution_id=source_solution.id if source_solution else None,
                    title="Pilotaż lokalnego wsparcia w codziennych aktywnościach",
                    description=(
                        "Test współpracy mieszkańców, partnerów lokalnych i wolontariuszy wokół "
                        "wybranego rozwiązania społecznego."
                    ),
                    status="recruitment_funding",
                    budget_declared=12000.0,
                    budget_approved=12000.0,
                    accountable_owner="Koordynator pilotażu",
                    partners="Partner lokalny",
                    test_plan="Rekrutacja uczestników, realizacja działań i zebranie opinii.",
                    max_volunteers=6,
                )
            )
        # New compatible table; this is safe on existing SQLite/PostgreSQL data and
        # materialises locations before the map is served.
        EntityGeoLocationService(db).backfill_all(commit=False)
        db.commit()
        AuthService(db).ensure_configured_test_admin()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        seed_initial_demo_data()
    except Exception as exc:
        # DB might not be reachable immediately (e.g. sandboxed test environment)
        pass
    yield

app = FastAPI(
    title="HUBMI API — Małopolska Social Innovation Hub",
    description="Backend aplikacyjny: matchmaking potrzeb społecznych, innowacje, przepływy pracy, głosowanie i piloty.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/healthz", tags=["System"])
def healthcheck():
    return {"status": "ok", "app": "HUBMI API", "version": "0.1.0"}

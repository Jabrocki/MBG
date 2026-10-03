from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.config import settings
from src.db.base import Base
from src.db.session import engine, SessionLocal
from src.api.router import api_router
from src.models.user import User
from src.models.source import SourceKnowledge, Solution
from src.models.problem import CanonicalProblem
from src.services.auth_service import DEMO_ACCOUNTS

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

        db.commit()

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

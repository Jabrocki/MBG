from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = ConfigDict(extra="allow", env_file=".env")

    PROJECT_NAME: str = "HUBMI API"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql+psycopg://kajetanserwecinski@localhost:5432/hubmi"
    SECRET_KEY: str = "hubmi-dev-secret-key-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    # Małopolska bounds for location validation (approx: lat 49.0 to 50.6, lon 19.0 to 21.5)
    MALOPOLSKA_MIN_LAT: float = 49.0
    MALOPOLSKA_MAX_LAT: float = 50.6
    MALOPOLSKA_MIN_LON: float = 19.0
    MALOPOLSKA_MAX_LON: float = 21.5
    
    # Expiry defaults
    REPORT_EXPIRY_DAYS: int = 30
    
    # AI thresholds
    GROUPING_CONFIDENCE_THRESHOLD: float = 0.75
    MIN_MATCH_SCORE: float = 0.50
    AI_PROVIDER: str = "fake"  # fake for tests; ollama on hackyeah
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_CHAT_MODEL: str = "hubmi-synthetic"
    OLLAMA_EMBEDDING_MODEL: str = "nomic-embed-text"
    OLLAMA_INNOVATIONS_INDEX: str = "../data/embeddings/innovations.jsonl"

    # Optional deployment-only account for testing administrator workflows.  Credentials are
    # supplied as environment variables on the server and never committed to the repository.
    TEST_ADMIN_EMAIL: str = ""
    TEST_ADMIN_PASSWORD: str = ""
    TEST_ADMIN_NAME: str = "Administrator"
    TEST_ADMIN_SURNAME: str = "Testowy"
    ALLOW_DEMO_ADMIN_LOGIN: bool = False

settings = Settings()

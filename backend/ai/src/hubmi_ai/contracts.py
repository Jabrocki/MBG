"""Public, application-independent boundary for Hubmi AI."""
from dataclasses import dataclass
from typing import Protocol, Sequence

@dataclass(frozen=True)
class Candidate:
    id: str; score: float; title: str; source_url: str | None; explanation: str; limitations: tuple[str, ...] = ()

@dataclass(frozen=True)
class ReportAnalysis:
    original_text: str; sanitized_text: str; categories: tuple[str, ...]; audience: str | None; urgency: str | None; duration: str | None; hyde_description: str

@dataclass(frozen=True)
class MatchResult:
    analysis: ReportAnalysis; problems: tuple[Candidate, ...]; innovations: tuple[Candidate, ...]; coordinates: dict[str, tuple[float, float, float]]

class EmbeddingProvider(Protocol):
    def embed_documents(self, texts: Sequence[str]) -> list[list[float]]: ...

class VectorRepository(Protocol):
    def search(self, collection: str, vector: Sequence[float], limit: int) -> Sequence[Candidate]: ...

class GenerativeProvider(Protocol):
    def generate_json(self, prompt: str, schema: dict) -> dict: ...

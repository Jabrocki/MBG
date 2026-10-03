from __future__ import annotations
from .contracts import Candidate, EmbeddingProvider, GenerativeProvider, MatchResult, ReportAnalysis, VectorRepository
from .sanitize import sanitize

class AiService:
    def __init__(self, embeddings: EmbeddingProvider, repository: VectorRepository, generator: GenerativeProvider | None = None): self.embeddings, self.repository, self.generator = embeddings, repository, generator
    def analyse_report(self, text: str) -> ReportAnalysis:
        clean = sanitize(text)
        data = self.generator.generate_json("Zwróć kategorie, odbiorców, pilność, czas trwania oraz opis problemu. Tekst: " + clean, {"type":"object"}) if self.generator else {}
        return ReportAnalysis(text, clean, tuple(data.get("categories", ())), data.get("audience"), data.get("urgency"), data.get("duration"), data.get("hyde_description", clean))
    def match(self, text: str, limit: int = 10) -> MatchResult:
        analysis = self.analyse_report(text)
        vector = self.embeddings.embed_documents([analysis.hyde_description])[0]
        problems = tuple(self.repository.search("problems", vector, limit=3))
        raw = self.repository.search("innovations", vector, limit=limit * 3)
        seen, innovations = set(), []
        for item in raw:
            if item.id not in seen:
                seen.add(item.id); innovations.append(item)
            if len(innovations) == limit: break
        return MatchResult(analysis, problems, tuple(innovations), {})

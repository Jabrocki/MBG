import sys
import logging
from typing import List, Optional
from src.adapters.ai_interface import (
    AIGatewayProtocol,
    ClassificationResult,
    ProblemCandidate,
    HyDEResult,
    SolutionMatch,
    RefinedIdeaResult,
)
from src.adapters.fake_ai_gateway import FakeAIGateway
from src.config import settings

logger = logging.getLogger(__name__)

class AIGatewayAdapter:
    """Production AI Gateway adapter connecting backend/app with backend/ai package."""

    def __init__(self, fallback_to_fake: bool = True):
        self._gateway: AIGatewayProtocol
        if settings.AI_PROVIDER.lower() == "ollama":
            from src.adapters.ollama_rag_gateway import OllamaRagGateway
            self._gateway = OllamaRagGateway(
                settings.OLLAMA_BASE_URL,
                settings.OLLAMA_CHAT_MODEL,
                settings.OLLAMA_EMBEDDING_MODEL,
                settings.OLLAMA_INNOVATIONS_INDEX,
            )
            logger.info("Loaded Ollama RAG gateway")
            return
        try:
            # Attempt importing the package provided by Person 3 in backend/ai
            import importlib
            ai_pkg = importlib.import_module("ai.service")
            self._gateway = ai_pkg.AIService()
            logger.info("Loaded live AI service from backend/ai")
        except (ImportError, AttributeError) as exc:
            if fallback_to_fake:
                logger.warning("backend/ai not found or incomplete. Falling back to FakeAIGateway. (%s)", exc)
                self._gateway = FakeAIGateway()
            else:
                raise RuntimeError(f"Failed to initialize live backend/ai service: {exc}") from exc

    def classify_report(self, text: str) -> ClassificationResult:
        return self._gateway.classify_report(text)

    def generate_hyde_and_embedding(self, text: str, categories: List[str]) -> HyDEResult:
        return self._gateway.generate_hyde_and_embedding(text, categories)

    def find_problem_candidates(
        self,
        report_text: str,
        lat: float,
        lon: float,
        categories: List[str]
    ) -> List[ProblemCandidate]:
        return self._gateway.find_problem_candidates(report_text, lat, lon, categories)

    def match_solutions_for_problem(
        self,
        problem_id: int,
        description: str,
        categories: List[str],
        lat: float,
        lon: float
    ) -> List[SolutionMatch]:
        return self._gateway.match_solutions_for_problem(problem_id, description, categories, lat, lon)

    def refine_idea(self, raw_text: str) -> RefinedIdeaResult:
        return self._gateway.refine_idea(raw_text)

    def adapt_institution_innovation(
        self,
        solution_title: str,
        solution_description: str,
        beneficiaries: str,
        location: str,
        resources: str,
        budget: str,
        constraints: str
    ) -> str:
        return self._gateway.adapt_institution_innovation(
            solution_title, solution_description, beneficiaries, location, resources, budget, constraints
        )

# Global singleton instance for injection
_ai_gateway = AIGatewayAdapter()

def get_ai_gateway() -> AIGatewayAdapter:
    return _ai_gateway

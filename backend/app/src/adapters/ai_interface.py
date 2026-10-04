from typing import Protocol, List, Optional, Dict, Any
from pydantic import BaseModel

class ClassificationResult(BaseModel):
    categories: List[str]
    audience: str
    urgency: str  # "standard" | "urgent"
    duration: str
    is_urgent: bool
    needs_revision: bool = False
    revision_reason: Optional[str] = None

class ProblemCandidate(BaseModel):
    problem_id: int
    confidence: float
    title: str

class HyDEResult(BaseModel):
    generated_description: str
    embedding: List[float]

class SolutionMatch(BaseModel):
    solution_id: int
    rank: int
    score: float
    explanation: str
    limitations: str
    coord_x: float
    coord_y: float
    coord_z: float

class RefinedIdeaResult(BaseModel):
    text_refined: str
    need: str
    beneficiaries: str
    solution: str
    partners: str
    costs: str
    resources: str
    stages: str

class AIGatewayProtocol(Protocol):
    def classify_report(self, text: str) -> ClassificationResult:
        ...

    def generate_hyde_and_embedding(self, text: str, categories: List[str]) -> HyDEResult:
        ...

    def find_problem_candidates(
        self,
        report_text: str,
        lat: float,
        lon: float,
        categories: List[str]
    ) -> List[ProblemCandidate]:
        ...

    def match_solutions_for_problem(
        self,
        problem_id: int,
        description: str,
        categories: List[str],
        lat: float,
        lon: float
    ) -> List[SolutionMatch]:
        ...

    def refine_idea(self, raw_text: str) -> RefinedIdeaResult:
        ...

    def discuss_idea(self, idea_text: str, structured_context: str, question: str) -> str:
        ...

    def generate_short_title(self, title: str) -> str:
        ...

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
        ...

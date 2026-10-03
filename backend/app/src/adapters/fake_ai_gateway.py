from typing import List, Optional
from src.adapters.ai_interface import (
    AIGatewayProtocol,
    ClassificationResult,
    ProblemCandidate,
    HyDEResult,
    SolutionMatch,
    RefinedIdeaResult,
)

class FakeAIGateway:
    """Deterministic Fake AI gateway for offline tests and decoupled development."""

    def __init__(self, simulate_outage: bool = False):
        self.simulate_outage = simulate_outage

    def classify_report(self, text: str) -> ClassificationResult:
        if self.simulate_outage:
            raise RuntimeError("AI Service unavailable")
        
        lower = text.lower()
        is_urgent = any(w in lower for w in ["zagrożenie", "natychmiast", "niebezpieczeństwo", "pożar", "przemoc"])
        
        categories = []
        if any(w in lower for w in ["senior", "starsz", "emeryt"]):
            categories.append("Seniorzy")
        if any(w in lower for w in ["dzieci", "szkoł", "edukac"]):
            categories.append("Edukacja")
        if any(w in lower for w in ["dostępn", "wózek", "niepełnosprawn"]):
            categories.append("Dostępność")
        if not categories:
            categories.append("Społeczność lokalna")

        return ClassificationResult(
            categories=categories,
            audience="Osoby starsze i opiekunowie" if "Seniorzy" in categories else "Mieszkańcy gminy",
            urgency="urgent" if is_urgent else "standard",
            duration="długoterminowy" if "infrastruktura" in lower else "średniookresowy",
            is_urgent=is_urgent,
            needs_revision=len(text.strip()) < 10,
            revision_reason="Tekst zgłoszenia jest zbyt krótki. Prosimy o podanie więcej szczegółów." if len(text.strip()) < 10 else None
        )

    def generate_hyde_and_embedding(self, text: str, categories: List[str]) -> HyDEResult:
        if self.simulate_outage:
            raise RuntimeError("AI Service unavailable")
        
        gen_desc = f"[HyDE Synthesized Solution]: Zorganizowany system wsparcia dla wyzwania: {text[:100]}..."
        # Deterministic normalized embedding compatible with Nomic's 512 dimensions.
        raw_embedding = [float((i % 17) + 1) for i in range(512)]
        norm = sum(value * value for value in raw_embedding) ** 0.5
        embedding = [value / norm for value in raw_embedding]
        return HyDEResult(
            generated_description=gen_desc,
            embedding=embedding
        )

    def find_problem_candidates(
        self,
        report_text: str,
        lat: float,
        lon: float,
        categories: List[str]
    ) -> List[ProblemCandidate]:
        if self.simulate_outage:
            raise RuntimeError("AI Service unavailable")
        
        # Returns candidate if keyword matches, otherwise empty list
        if "senior" in report_text.lower():
            return [
                ProblemCandidate(problem_id=1, confidence=0.88, title="Brak opieki wytchnieniowej dla seniorów"),
                ProblemCandidate(problem_id=2, confidence=0.62, title="Bariery architektoniczne dla osób starszych")
            ]
        return []

    def match_solutions_for_problem(
        self,
        problem_id: int,
        description: str,
        categories: List[str],
        lat: float,
        lon: float
    ) -> List[SolutionMatch]:
        if self.simulate_outage:
            raise RuntimeError("AI Service unavailable")
        
        return [
            SolutionMatch(
                solution_id=1,
                rank=1,
                score=0.92,
                explanation="Innowacja doskonale odpowiada na zgłoszony brak dostępności i wspiera aktywizację.",
                limitations="Wymaga koordynatora gminnego i przeszkolonego personelu.",
                coord_x=1.2,
                coord_y=-0.5,
                coord_z=0.8
            ),
            SolutionMatch(
                solution_id=2,
                rank=2,
                score=0.78,
                explanation="Model wolontariatu sąsiedzkiego sprawdzony w Małopolsce w latach 2021-2023.",
                limitations="Ograniczony zasięg w rejonach wiejskich.",
                coord_x=2.1,
                coord_y=1.1,
                coord_z=-0.3
            )
        ]

    def refine_idea(self, raw_text: str) -> RefinedIdeaResult:
        if self.simulate_outage:
            raise RuntimeError("AI Service unavailable")
        
        return RefinedIdeaResult(
            text_refined=f"Ustrukturyzowana inicjatywa: {raw_text}",
            need="Brak zorganizowanych form integracji międzypokoleniowej na osiedlu.",
            beneficiaries="Seniorzy, młodzież szkolna oraz lokalne rodziny.",
            solution="Cykl warsztatów wymiany umiejętności 'Młodzi uczą technologii, starsi rękodzieła'.",
            partners="Miejski Ośrodek Pomocy Społecznej, lokalna szkoła podstawowa, biblioteka.",
            costs="Szacunkowo 12 000 PLN (materiały warsztatowe, poczęstunek, koordynacja).",
            resources="Sala w bibliotece, 2 laptopy, rzutnik.",
            stages="1. Rekrutacja uczestników (miesiąc 1), 2. Cykl 8 warsztatów (miesiące 2-3), 3. Wystawa podsumowująca (miesiąc 4)."
        )

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
        if self.simulate_outage:
            raise RuntimeError("AI Service unavailable")
        
        return (
            f"### Plan adaptacji innowacji: {solution_title}\n\n"
            f"**Lokalizacja:** {location}\n"
            f"**Grupa docelowa:** {beneficiaries}\n"
            f"**Budżet adaptacyjny:** {budget}\n"
            f"**Wykorzystanie zasobów:** {resources}\n"
            f"**Uwzględnione ograniczenia:** {constraints}\n\n"
            f"#### Rekomendowany harmonogram wdrożenia:\n"
            f"1. Warsztat wstępny z zespołem instytucji i interesariuszami.\n"
            f"2. Przygotowanie regulaminu i procedur wsparcia.\n"
            f"3. Pilotażowe uruchomienie na próbie 20 beneficjentów.\n"
            f"4. Ewaluacja efektów po 90 dniach."
        )

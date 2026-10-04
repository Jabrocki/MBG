"""Ollama-backed RAG gateway used for live report analysis on the GPU server.

The generator receives only sanitized text plus the nearest catalogue excerpts.  Retrieval uses
the locally generated Nomic vectors, so recommendations retain a traceable source in the corpus.
"""
from __future__ import annotations

import json
import math
import re
import urllib.request
from pathlib import Path
from typing import Any

from src.adapters.ai_interface import (
    ClassificationResult,
    HyDEResult,
    ProblemCandidate,
    RefinedIdeaResult,
    SolutionMatch,
)


class OllamaRagGateway:
    def __init__(self, base_url: str, chat_model: str, embedding_model: str, embeddings_path: str):
        self.base_url = base_url.rstrip("/")
        self.chat_model = chat_model
        self.embedding_model = embedding_model
        self.records = self._load_records(Path(embeddings_path))

    @staticmethod
    def _load_records(path: Path) -> list[dict[str, Any]]:
        if not path.exists():
            raise RuntimeError(f"Nie znaleziono indeksu innowacji: {path}")
        rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]
        # IDs 1001+ are also used while seeding the relational catalogue on the application server.
        for solution_id, title in enumerate(sorted({row["title"] for row in rows}), start=1001):
            for row in rows:
                if row["title"] == title:
                    row["solution_id"] = solution_id
        return rows

    @staticmethod
    def _sanitize(text: str) -> str:
        text = re.sub(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b", "[USUNIĘTO]", text)
        text = re.sub(r"\b(?:\+48\s*)?\d(?:[\s-]?\d){8}\b", "[USUNIĘTO]", text)
        return re.sub(r"\s+", " ", text).strip()

    def _post(self, endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
        request = urllib.request.Request(
            f"{self.base_url}{endpoint}", json.dumps(payload).encode(), {"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(request, timeout=120) as response:
            return json.loads(response.read())

    def _json(self, prompt: str) -> dict[str, Any]:
        response = self._post(
            "/api/generate",
            {"model": self.chat_model, "prompt": prompt, "format": "json", "stream": False, "options": {"temperature": 0.2}},
        )
        try:
            return json.loads(response["response"])
        except (KeyError, TypeError, json.JSONDecodeError) as exc:
            raise RuntimeError("Ollama nie zwróciła poprawnego JSON") from exc

    def _text(self, prompt: str) -> str:
        response = self._post(
            "/api/generate",
            {"model": self.chat_model, "prompt": prompt, "stream": False, "options": {"temperature": 0.35}},
        )
        return str(response.get("response") or "").strip()

    def _embed(self, text: str) -> list[float]:
        response = self._post("/api/embed", {"model": self.embedding_model, "input": [f"search_query: {text}"]})
        vector = response["embeddings"][0][:512]
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]

    def _nearest(self, text: str, limit: int = 8) -> list[tuple[float, dict[str, Any]]]:
        vector = self._embed(text)
        scored = [(sum(a * b for a, b in zip(vector, row["embedding"])), row) for row in self.records]
        scored.sort(key=lambda item: item[0], reverse=True)
        unique: dict[str, tuple[float, dict[str, Any]]] = {}
        for score, row in scored:
            unique.setdefault(row["title"], (score, row))
            if len(unique) == limit:
                break
        return list(unique.values())

    @staticmethod
    def _context(rows: list[tuple[float, dict[str, Any]]]) -> str:
        return "\n\n".join(f"[{row['title']}] {row['content'][:1200]}" for _, row in rows)

    def classify_report(self, text: str) -> ClassificationResult:
        clean = self._sanitize(text)
        data = self._json(
            "Jesteś polskim asystentem zgłoszeń społecznych w Małopolsce. Zwróć wyłącznie JSON z polami: "
            "categories (lista krótkich kategorii), audience, urgency (standard albo urgent), duration, "
            "is_urgent (boolean), needs_revision (boolean), revision_reason. Nie wymyślaj danych osobowych.\n"
            f"ZGŁOSZENIE: {clean}"
        )
        urgency = "urgent" if data.get("urgency") == "urgent" or data.get("is_urgent") is True else "standard"
        categories = [str(item) for item in data.get("categories", []) if str(item).strip()] or ["Społeczność lokalna"]
        return ClassificationResult(
            categories=categories,
            audience=str(data.get("audience") or "Mieszkańcy Małopolski"),
            urgency=urgency,
            duration=str(data.get("duration") or "nieznany"),
            is_urgent=urgency == "urgent",
            needs_revision=bool(data.get("needs_revision")),
            revision_reason=str(data.get("revision_reason")) if data.get("needs_revision") else None,
        )

    def find_problem_candidates(self, report_text: str, lat: float, lon: float, categories: list[str]) -> list[ProblemCandidate]:
        # Canonical-problem IDs live in the relational store; corpus hits are not silently treated as user problems.
        return []

    def generate_hyde_and_embedding(self, text: str, categories: list[str]) -> HyDEResult:
        clean = self._sanitize(text)
        retrieved = self._nearest(clean, limit=4)
        data = self._json(
            "Na podstawie zgłoszenia i podanych źródeł przygotuj krótki, neutralny opis potrzeby do wyszukiwania "
            "rozwiązań. Zwróć JSON {\"description\": \"...\"}. Nie podawaj faktów, których nie ma w zgłoszeniu.\n"
            f"ZGŁOSZENIE: {clean}\nŹRÓDŁA:\n{self._context(retrieved)}"
        )
        description = str(data.get("description") or clean)
        return HyDEResult(generated_description=description, embedding=self._embed(description))

    def match_solutions_for_problem(self, problem_id: int, description: str, categories: list[str], lat: float, lon: float) -> list[SolutionMatch]:
        retrieved = self._nearest(description, limit=10)
        if not retrieved:
            return []
        guidance = self._json(
            "Na podstawie poniższych źródeł wyjaśnij ostrożnie, dlaczego mogą pomóc w opisanej potrzebie. "
            "Zwróć JSON {\"explanation\": \"...\", \"limitations\": \"...\"}. Nie twierdź, że rozwiązanie jest wdrożone lokalnie.\n"
            f"POTRZEBA: {description}\nŹRÓDŁA:\n{self._context(retrieved[:3])}"
        )
        explanation = str(guidance.get("explanation") or "Propozycja została znaleziona semantycznie w katalogu źródłowym.")
        limitations = str(guidance.get("limitations") or "Wymaga lokalnej weryfikacji warunków wdrożenia i źródła.")
        return [
            SolutionMatch(
                solution_id=row["solution_id"], rank=index, score=max(0.5, min(0.99, (score + 1) / 2)),
                explanation=explanation, limitations=limitations,
                coord_x=round(score, 4), coord_y=round(index / 10, 4), coord_z=0.0,
            )
            for index, (score, row) in enumerate(retrieved, start=1)
        ]

    def refine_idea(self, raw_text: str) -> RefinedIdeaResult:
        clean = self._sanitize(raw_text)
        data = self._json(
            "Uporządkuj pomysł społeczny zapisany po polsku. Zwróć wyłącznie JSON z polami: "
            "text_refined, need, beneficiaries, solution, partners, costs, resources, stages. "
            "Nie dodawaj danych osobowych ani nie przedstawiaj szacunków jako zatwierdzonych faktów. "
            f"POMYSŁ: {clean}"
        )
        values = {field: str(data.get(field) or "").strip() for field in (
            "text_refined", "need", "beneficiaries", "solution", "partners", "costs", "resources", "stages"
        )}
        values["text_refined"] = values["text_refined"] or clean
        values["solution"] = values["solution"] or clean
        return RefinedIdeaResult(**values)

    def discuss_idea(self, idea_text: str, structured_context: str, question: str) -> str:
        prompt = (
            "Jesteś doradcą AI w dyskusji nad jednym pomysłem społecznym. Odpowiadaj po polsku, konkretnie i krótko. "
            "Rozmawiaj wyłącznie o tym pomyśle; nie łącz go z innymi pomysłami i nie twórz niezależnego rozwiązania. "
            "Możesz oszacować brakujące elementy jako hipotezy i wyraźnie oznacz niepewność. "
            f"POMYSŁ: {self._sanitize(idea_text)}\nDANE OSZACOWANE PRZEZ AI: {self._sanitize(structured_context)}\n"
            f"PYTANIE UŻYTKOWNIKA: {self._sanitize(question)}"
        )
        try:
            data = self._json(prompt + "\nZwróć JSON {\"answer\": \"odpowiedź\"}.")
            answer = str(data.get("answer") or data.get("response") or data.get("message") or "").strip()
        except RuntimeError:
            answer = self._text(prompt + "\nOdpowiedz bezpośrednio, bez JSON i bez markdownowego nagłówka.")
        return answer or "Nie mam jeszcze wystarczających danych, aby odpowiedzieć."

    def adapt_institution_innovation(
        self,
        solution_title: str,
        solution_description: str,
        beneficiaries: str,
        location: str,
        resources: str,
        budget: str,
        constraints: str,
    ) -> str:
        clean_title = self._sanitize(solution_title)
        clean_description = self._sanitize(solution_description)
        clean_beneficiaries = self._sanitize(beneficiaries)
        clean_location = self._sanitize(location)
        clean_resources = self._sanitize(resources)
        clean_budget = self._sanitize(budget)
        clean_constraints = self._sanitize(constraints)
        data = self._json(
            "Przygotuj po polsku roboczy plan adaptacji innowacji społecznej dla instytucji. "
            "Zwróć JSON z jednym polem adaptation zawierającym czytelny tekst z krokami, "
            "zasobami, ograniczeniami i pytaniami do weryfikacji. Nie obiecuj efektów i nie zatwierdzaj budżetu. "
            f"INNOWACJA: {clean_title}\nOPIS: {clean_description}\nODBIORCY: {clean_beneficiaries}\n"
            f"LOKALIZACJA: {clean_location}\nZASOBY: {clean_resources}\nBUDŻET: {clean_budget}\n"
            f"OGRANICZENIA: {clean_constraints}"
        )
        return str(data.get("adaptation") or data.get("draft_adaptation") or clean_description).strip()

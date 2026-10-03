import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
from hubmi_ai.contracts import Candidate
from hubmi_ai.sanitize import sanitize
from hubmi_ai.service import AiService

class Embeddings:
    def embed_documents(self, texts): return [[0.1, 0.2] for _ in texts]
class Repository:
    def search(self, collection, vector, limit):
        if collection == "problems": return [Candidate("p1", .8, "Problem", None, "źródło")]
        return [Candidate("i1", .9, "Innowacja", "https://example.test", "źródło"), Candidate("i1", .8, "Duplikat", None, "źródło")]

def test_sanitize_direct_identifiers():
    clean = sanitize("Napisz na ala@example.org albo +48 600 123 456, 30-001")
    assert "example.org" not in clean and "600" not in clean and "30-001" not in clean

def test_match_returns_deduplicated_candidates_without_generator():
    result = AiService(Embeddings(), Repository()).match("Potrzebuję pomocy")
    assert result.problems[0].id == "p1"
    assert [item.id for item in result.innovations] == ["i1"]

from src.adapters.vector_repository import VectorRepositoryAdapter
from src.models.problem import CanonicalProblem
from src.models.source import ProblemVectorRecord


def test_search_implements_ai_repository_contract(db_session):
    problem = CanonicalProblem(
        title="Bariery dostępności",
        generated_description="Opis problemu",
        location_centroid_lat=50.06,
        location_centroid_lon=19.94,
    )
    db_session.add(problem)
    db_session.flush()
    db_session.add(
        ProblemVectorRecord(
            entity_type="problem",
            entity_id=problem.id,
            embedding=[1.0, 0.0],
        )
    )
    db_session.commit()

    candidates = VectorRepositoryAdapter(db_session).search(
        "problems",
        [1.0, 0.0],
        limit=1,
    )

    assert len(candidates) == 1
    assert candidates[0].id == str(problem.id)
    assert candidates[0].title == problem.title
    assert candidates[0].score == 1.0

import math
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from src.models.source import ProblemVectorRecord, Solution
from src.models.problem import CanonicalProblem


@dataclass(frozen=True)
class VectorCandidate:
    id: str
    score: float
    title: str
    source_url: Optional[str]
    explanation: str
    limitations: tuple[str, ...] = ()

class VectorRepositoryAdapter:
    """PostgreSQL adapter for problem and solution vector embeddings and coordinates.
    Owned by Person 2; implements storage and vector queries for Person 3's algorithms.
    """

    def __init__(self, db: Session):
        self.db = db

    def upsert_vector_record(
        self,
        entity_type: str,
        entity_id: int,
        embedding: List[float],
        coord_x: float = 0.0,
        coord_y: float = 0.0,
        coord_z: float = 0.0,
    ) -> ProblemVectorRecord:
        record = self.db.execute(
            select(ProblemVectorRecord).where(
                and_(
                    ProblemVectorRecord.entity_type == entity_type,
                    ProblemVectorRecord.entity_id == entity_id,
                )
            )
        ).scalar_one_or_none()

        if record:
            record.embedding = embedding
            record.coord_x = coord_x
            record.coord_y = coord_y
            record.coord_z = coord_z
        else:
            record = ProblemVectorRecord(
                entity_type=entity_type,
                entity_id=entity_id,
                embedding=embedding,
                coord_x=coord_x,
                coord_y=coord_y,
                coord_z=coord_z,
            )
            self.db.add(record)
        
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_vector_record(self, entity_type: str, entity_id: int) -> Optional[ProblemVectorRecord]:
        return self.db.execute(
            select(ProblemVectorRecord).where(
                and_(
                    ProblemVectorRecord.entity_type == entity_type,
                    ProblemVectorRecord.entity_id == entity_id,
                )
            )
        ).scalar_one_or_none()

    def search_similar_entities(
        self,
        target_embedding: List[float],
        entity_type: str,
        top_k: int = 10,
        min_similarity: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """Cosine similarity search across vector records.
        Works across both raw pgvector (when extension is enabled) and python fallback.
        """
        records = self.db.execute(
            select(ProblemVectorRecord).where(ProblemVectorRecord.entity_type == entity_type)
        ).scalars().all()

        scored = []
        for rec in records:
            if not rec.embedding or len(rec.embedding) != len(target_embedding):
                continue
            sim = self._cosine_similarity(target_embedding, rec.embedding)
            if sim >= min_similarity:
                scored.append({
                    "entity_id": rec.entity_id,
                    "similarity": sim,
                    "coord_x": rec.coord_x,
                    "coord_y": rec.coord_y,
                    "coord_z": rec.coord_z,
                })

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k]

    def search(
        self,
        collection: str,
        vector: List[float],
        limit: int,
    ) -> List[VectorCandidate]:
        """Expose the AI package repository contract over application records."""
        entity_type = {
            "problems": "problem",
            "innovations": "solution",
        }.get(collection)
        if entity_type is None:
            raise ValueError(f"Unsupported vector collection: {collection}")

        candidates = self.search_similar_entities(
            target_embedding=vector,
            entity_type=entity_type,
            top_k=limit,
        )
        results: List[VectorCandidate] = []
        for candidate in candidates:
            entity_id = candidate["entity_id"]
            if entity_type == "problem":
                entity = self.db.get(CanonicalProblem, entity_id)
                title = entity.title if entity else f"Problem #{entity_id}"
                source_url = None
                limitations: tuple[str, ...] = ()
            else:
                entity = self.db.get(Solution, entity_id)
                title = entity.title if entity else f"Innowacja #{entity_id}"
                source_url = (
                    entity.source_knowledge.source_url
                    if entity and entity.source_knowledge
                    else None
                )
                limitations = (
                    (entity.limitations,)
                    if entity and entity.limitations
                    else ()
                )
            results.append(
                VectorCandidate(
                    id=str(entity_id),
                    score=candidate["similarity"],
                    title=title,
                    source_url=source_url,
                    explanation="Dopasowanie na podstawie podobieństwa embeddingów.",
                    limitations=limitations,
                )
            )
        return results

    @staticmethod
    def _cosine_similarity(v1: List[float], v2: List[float]) -> float:
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)

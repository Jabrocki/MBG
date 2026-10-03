import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from src.models.source import ProblemVectorRecord

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

    @staticmethod
    def _cosine_similarity(v1: List[float], v2: List[float]) -> float:
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot / (norm1 * norm2)

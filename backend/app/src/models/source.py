from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import Optional, List, Any
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base

class SourceKnowledge(Base):
    __tablename__ = "source_knowledge"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_url: Mapped[str] = mapped_column(String(500), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="Ogólne")
    provenance_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    solutions = relationship("Solution", back_populates="source_knowledge", cascade="all, delete-orphan")

class Solution(Base):
    __tablename__ = "solutions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_knowledge_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("source_knowledge.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    target_audience: Mapped[str] = mapped_column(String(200), default="Wszyscy mieszkańcy")
    cost_estimate: Mapped[str] = mapped_column(String(100), default="Niski/Średni")
    limitations: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    source_knowledge = relationship("SourceKnowledge", back_populates="solutions")
    matches = relationship("MatchResult", back_populates="solution", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="solution", cascade="all, delete-orphan")
    pilots = relationship("Pilot", back_populates="solution")

class ProblemVectorRecord(Base):
    __tablename__ = "problem_vector_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "problem" | "solution"
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    embedding: Mapped[list] = mapped_column(JSON, default=list)  # Floats list
    coord_x: Mapped[float] = mapped_column(Float, default=0.0)
    coord_y: Mapped[float] = mapped_column(Float, default=0.0)
    coord_z: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

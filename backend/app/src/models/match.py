from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base

class MatchResult(Base):
    __tablename__ = "match_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=True)
    problem_id: Mapped[int] = mapped_column(Integer, ForeignKey("canonical_problems.id", ondelete="CASCADE"), nullable=False)
    solution_id: Mapped[int] = mapped_column(Integer, ForeignKey("solutions.id", ondelete="CASCADE"), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False, default="")
    limitations: Mapped[str] = mapped_column(Text, nullable=False, default="")
    coord_x: Mapped[float] = mapped_column(Float, default=0.0)
    coord_y: Mapped[float] = mapped_column(Float, default=0.0)
    coord_z: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    problem = relationship("CanonicalProblem", back_populates="matches")
    solution = relationship("Solution", back_populates="matches")

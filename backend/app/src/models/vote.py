from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base

class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    solution_id: Mapped[int] = mapped_column(Integer, ForeignKey("solutions.id", ondelete="CASCADE"), nullable=False)
    local_problem_id: Mapped[int] = mapped_column(Integer, ForeignKey("canonical_problems.id", ondelete="CASCADE"), nullable=False)
    vote_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "support" | "skip"
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="votes")
    solution = relationship("Solution", back_populates="votes")
    problem = relationship("CanonicalProblem", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("user_id", "solution_id", "local_problem_id", name="uq_user_solution_problem_vote"),
    )

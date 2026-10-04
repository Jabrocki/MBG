from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base

class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    canonical_problem_id: Mapped[int] = mapped_column(Integer, ForeignKey("canonical_problems.id", ondelete="RESTRICT"), nullable=False, index=True)
    text_raw: Mapped[str] = mapped_column(Text, nullable=False)
    text_refined: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    need: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    beneficiaries: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    solution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    partners: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    costs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resources: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stages: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Stany cyklu życia pomysłu wg tasks.md / README:
    # private_draft -> queued -> pending_author -> pending_admin -> public
    status: Mapped[str] = mapped_column(String(50), default="private_draft", nullable=False)
    support_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    skip_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    threads = relationship("DiscussionThread", back_populates="idea", cascade="all, delete-orphan")
    pilots = relationship("Pilot", back_populates="idea")
    canonical_problem = relationship("CanonicalProblem")

class AIJob(Base):
    __tablename__ = "ai_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "idea" | "report" | "adaptation"
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    job_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "refine_idea" | "matchmaking"
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending | processing | done | failed
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

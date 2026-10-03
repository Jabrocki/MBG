from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base

class CanonicalProblem(Base):
    __tablename__ = "canonical_problems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    generated_description: Mapped[str] = mapped_column(Text, nullable=False)
    reporter_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    location_centroid_lat: Mapped[float] = mapped_column(Float, nullable=False)
    location_centroid_lon: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # active | merged | resolved
    recurrence_recommended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    reports = relationship("Report", back_populates="canonical_problem")
    links = relationship("ReportProblemLink", back_populates="problem", cascade="all, delete-orphan")
    matches = relationship("MatchResult", back_populates="problem", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="problem", cascade="all, delete-orphan")

class ReportProblemLink(Base):
    __tablename__ = "report_problem_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    problem_id: Mapped[int] = mapped_column(Integer, ForeignKey("canonical_problems.id", ondelete="CASCADE"), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="suggested", nullable=False)  # suggested | confirmed | rejected
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    confirmed_by_user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    report = relationship("Report", back_populates="links")
    problem = relationship("CanonicalProblem", back_populates="links")

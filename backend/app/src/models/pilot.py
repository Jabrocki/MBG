from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Float, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base

class Pilot(Base):
    __tablename__ = "pilots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    solution_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("solutions.id", ondelete="SET NULL"), nullable=True)
    idea_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("ideas.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    
    # Lifecycle: draft -> review -> recruitment_funding -> pilot -> evaluation -> dissemination (lub unavailable)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    
    # Preconditions for pilot start:
    budget_declared: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    budget_approved: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    accountable_owner: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    partners: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    test_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    max_volunteers: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    solution = relationship("Solution", back_populates="pilots")
    idea = relationship("Idea", back_populates="pilots")
    volunteers = relationship("Volunteer", back_populates="pilot", cascade="all, delete-orphan")
    feedbacks = relationship("SatisfactionFeedback", back_populates="pilot", cascade="all, delete-orphan")

class Volunteer(Base):
    __tablename__ = "volunteers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pilot_id: Mapped[int] = mapped_column(Integer, ForeignKey("pilots.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # status: registered -> waiting -> offered -> accepted | cancelled
    status: Mapped[str] = mapped_column(String(30), default="registered", nullable=False)
    skills_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    offered_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    pilot = relationship("Pilot", back_populates="volunteers")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("pilot_id", "user_id", name="uq_pilot_user_volunteer"),
    )

class SatisfactionFeedback(Base):
    __tablename__ = "satisfaction_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pilot_id: Mapped[int] = mapped_column(Integer, ForeignKey("pilots.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False)  # "beneficiary" | "volunteer"
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    improvements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    pilot = relationship("Pilot", back_populates="feedbacks")
    user = relationship("User")

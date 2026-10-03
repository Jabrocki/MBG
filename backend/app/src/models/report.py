from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Float, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text_raw: Mapped[str] = mapped_column(Text, nullable=False)
    location_lat: Mapped[float] = mapped_column(Float, nullable=False)
    location_lon: Mapped[float] = mapped_column(Float, nullable=False)
    location_type: Mapped[str] = mapped_column(String(50), default="map")  # map | manual | gps
    location_name: Mapped[str] = mapped_column(String(255), default="Małopolska")
    categories: Mapped[list] = mapped_column(JSON, default=list)  # list of strings
    audience: Mapped[str] = mapped_column(String(200), default="Mieszkańcy")
    urgency: Mapped[str] = mapped_column(String(50), default="standard")  # standard | urgent
    duration: Mapped[str] = mapped_column(String(100), default="nieznany")
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    canonical_problem_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("canonical_problems.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="submitted")  # submitted | confirmed | rejected
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    author = relationship("User", back_populates="reports")
    canonical_problem = relationship("CanonicalProblem", back_populates="reports")
    links = relationship("ReportProblemLink", back_populates="report", cascade="all, delete-orphan")

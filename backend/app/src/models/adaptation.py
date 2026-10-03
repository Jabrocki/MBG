from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db.base import Base

class InstitutionAdaptation(Base):
    __tablename__ = "institution_adaptations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    solution_id: Mapped[int] = mapped_column(Integer, ForeignKey("solutions.id", ondelete="CASCADE"), nullable=False)
    beneficiaries: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    resources: Mapped[str] = mapped_column(Text, nullable=False)
    budget: Mapped[str] = mapped_column(String(100), nullable=False)
    constraints: Mapped[str] = mapped_column(Text, nullable=False)
    draft_adaptation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    user = relationship("User")
    solution = relationship("Solution")

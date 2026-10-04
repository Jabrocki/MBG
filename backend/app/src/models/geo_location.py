from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base
from src.utils.datetime_utils import utc_now


class EntityGeoLocation(Base):
    """Durable WGS84 location projection for a domain entity.

    The existing domain tables intentionally remain unchanged.  This compatible table
    can be created with ``Base.metadata.create_all`` on a running SQLite/PostgreSQL
    deployment and is keyed by ``(entity_type, entity_id)``.  Innovation rows retain
    their source-knowledge relation for provenance; generic rows cover reports,
    canonical problems, innovations and pilots without adding nullable coordinates to
    every pre-existing model.
    """

    __tablename__ = "entity_geo_locations"
    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", name="uq_entity_geo_location"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    source_knowledge_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("source_knowledge.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    locality: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    # exact | aggregate | municipality.  Consumers must surface this precision.
    precision: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

"""Add compatible persistent geographic projection

Revision ID: 0002_entity_geo_locations
Revises: 0001_initial_schema
Create Date: 2026-10-04 02:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_entity_geo_locations"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if sa.inspect(bind).has_table("entity_geo_locations"):
        return

    op.create_table(
        "entity_geo_locations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("source_knowledge_id", sa.Integer(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("locality", sa.String(length=255), nullable=True),
        sa.Column("precision", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["source_knowledge_id"], ["source_knowledge.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("entity_type", "entity_id", name="uq_entity_geo_location"),
    )
    op.create_index("ix_entity_geo_locations_entity_type", "entity_geo_locations", ["entity_type"], unique=False)
    op.create_index("ix_entity_geo_locations_entity_id", "entity_geo_locations", ["entity_id"], unique=False)
    op.create_index("ix_entity_geo_locations_source_knowledge_id", "entity_geo_locations", ["source_knowledge_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    if sa.inspect(bind).has_table("entity_geo_locations"):
        op.drop_table("entity_geo_locations")

"""Persist the AI author flag for idea discussions."""

from alembic import op
import sqlalchemy as sa

revision = "0003_ai_thread_messages"
down_revision = "0002_entity_geo_locations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("thread_messages", sa.Column("is_ai", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column("thread_messages", "is_ai")

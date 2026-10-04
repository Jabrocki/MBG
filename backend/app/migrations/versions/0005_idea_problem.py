"""Attach every user idea to an existing canonical problem."""
from alembic import op
import sqlalchemy as sa

revision = "0005_idea_problem"
down_revision = "0004_password_reset_tokens"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing ideas were previously converted into a newly-created problem at
    # approval time. Keep those rows usable by attaching them to the first active
    # problem; new ideas are required to provide an explicit problem id.
    op.add_column("ideas", sa.Column("canonical_problem_id", sa.Integer(), nullable=True))
    op.execute("UPDATE ideas SET canonical_problem_id = (SELECT id FROM canonical_problems WHERE status = 'active' ORDER BY id LIMIT 1) WHERE canonical_problem_id IS NULL")
    op.alter_column("ideas", "canonical_problem_id", nullable=False)
    op.create_index("ix_ideas_canonical_problem_id", "ideas", ["canonical_problem_id"])


def downgrade() -> None:
    op.drop_index("ix_ideas_canonical_problem_id", table_name="ideas")
    op.drop_column("ideas", "canonical_problem_id")

"""Initial HUBMI schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-03 19:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Users & Sessions
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('surname', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='user'),
        sa.Column('is_anonymous_by_default', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.create_table(
        'demo_sessions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('token', sa.String(length=64), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_demo_sessions_token'), 'demo_sessions', ['token'], unique=True)

    # 2. Source Knowledge & Solutions
    op.create_table(
        'source_knowledge',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('source_url', sa.String(length=500), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('content_summary', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('provenance_metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'solutions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('source_knowledge_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('target_audience', sa.String(length=200), nullable=False),
        sa.Column('cost_estimate', sa.String(length=100), nullable=False),
        sa.Column('limitations', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['source_knowledge_id'], ['source_knowledge.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'problem_vector_records',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('embedding', sa.JSON(), nullable=False),
        sa.Column('coord_x', sa.Float(), nullable=False),
        sa.Column('coord_y', sa.Float(), nullable=False),
        sa.Column('coord_z', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_problem_vector_records_entity_id'), 'problem_vector_records', ['entity_id'], unique=False)

    # 3. Canonical Problems & Reports
    op.create_table(
        'canonical_problems',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('generated_description', sa.Text(), nullable=False),
        sa.Column('reporter_count', sa.Integer(), nullable=False),
        sa.Column('location_centroid_lat', sa.Float(), nullable=False),
        sa.Column('location_centroid_lon', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('recurrence_recommended', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'reports',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('text_raw', sa.Text(), nullable=False),
        sa.Column('location_lat', sa.Float(), nullable=False),
        sa.Column('location_lon', sa.Float(), nullable=False),
        sa.Column('location_type', sa.String(length=50), nullable=False),
        sa.Column('location_name', sa.String(length=255), nullable=False),
        sa.Column('categories', sa.JSON(), nullable=False),
        sa.Column('audience', sa.String(length=200), nullable=False),
        sa.Column('urgency', sa.String(length=50), nullable=False),
        sa.Column('duration', sa.String(length=100), nullable=False),
        sa.Column('is_urgent', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('canonical_problem_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['canonical_problem_id'], ['canonical_problems.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'report_problem_links',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('problem_id', sa.Integer(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('confirmed_by_user_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['problem_id'], ['canonical_problems.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. Matches
    op.create_table(
        'match_results',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=True),
        sa.Column('problem_id', sa.Integer(), nullable=False),
        sa.Column('solution_id', sa.Integer(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('limitations', sa.Text(), nullable=False),
        sa.Column('coord_x', sa.Float(), nullable=False),
        sa.Column('coord_y', sa.Float(), nullable=False),
        sa.Column('coord_z', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['problem_id'], ['canonical_problems.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['report_id'], ['reports.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['solution_id'], ['solutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Ideas & AI Jobs
    op.create_table(
        'ideas',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('text_raw', sa.Text(), nullable=False),
        sa.Column('text_refined', sa.Text(), nullable=True),
        sa.Column('need', sa.Text(), nullable=True),
        sa.Column('beneficiaries', sa.Text(), nullable=True),
        sa.Column('solution', sa.Text(), nullable=True),
        sa.Column('partners', sa.Text(), nullable=True),
        sa.Column('costs', sa.Text(), nullable=True),
        sa.Column('resources', sa.Text(), nullable=True),
        sa.Column('stages', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'ai_jobs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('job_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('attempt_count', sa.Integer(), nullable=False),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Votes (with unique constraint: user + solution + problem)
    op.create_table(
        'votes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('solution_id', sa.Integer(), nullable=False),
        sa.Column('local_problem_id', sa.Integer(), nullable=False),
        sa.Column('vote_type', sa.String(length=20), nullable=False),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['local_problem_id'], ['canonical_problems.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['solution_id'], ['solutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'solution_id', 'local_problem_id', name='uq_user_solution_problem_vote')
    )

    # 7. Pilots, Volunteers, Satisfaction
    op.create_table(
        'pilots',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('solution_id', sa.Integer(), nullable=True),
        sa.Column('idea_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('budget_declared', sa.Float(), nullable=False),
        sa.Column('budget_approved', sa.Float(), nullable=True),
        sa.Column('accountable_owner', sa.String(length=200), nullable=True),
        sa.Column('partners', sa.Text(), nullable=True),
        sa.Column('test_plan', sa.Text(), nullable=True),
        sa.Column('max_volunteers', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['idea_id'], ['ideas.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['solution_id'], ['solutions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'volunteers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pilot_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('skills_confirmed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('offered_at', sa.DateTime(), nullable=True),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pilot_id'], ['pilots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pilot_id', 'user_id', name='uq_pilot_user_volunteer')
    )

    op.create_table(
        'satisfaction_feedback',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pilot_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=30), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('improvements', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pilot_id'], ['pilots.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 8. Discussions, Notifications, Adaptations
    op.create_table(
        'discussion_threads',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('idea_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=300), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['idea_id'], ['ideas.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'thread_messages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('thread_id', sa.Integer(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['thread_id'], ['discussion_threads.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('link', sa.String(length=500), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'institution_adaptations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('solution_id', sa.Integer(), nullable=False),
        sa.Column('beneficiaries', sa.Text(), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('resources', sa.Text(), nullable=False),
        sa.Column('budget', sa.String(length=100), nullable=False),
        sa.Column('constraints', sa.Text(), nullable=False),
        sa.Column('draft_adaptation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['solution_id'], ['solutions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('institution_adaptations')
    op.drop_table('notifications')
    op.drop_table('thread_messages')
    op.drop_table('discussion_threads')
    op.drop_table('satisfaction_feedback')
    op.drop_table('volunteers')
    op.drop_table('pilots')
    op.drop_table('votes')
    op.drop_table('ai_jobs')
    op.drop_table('ideas')
    op.drop_table('match_results')
    op.drop_table('report_problem_links')
    op.drop_table('reports')
    op.drop_table('canonical_problems')
    op.drop_table('problem_vector_records')
    op.drop_table('solutions')
    op.drop_table('source_knowledge')
    op.drop_table('demo_sessions')
    op.drop_table('users')

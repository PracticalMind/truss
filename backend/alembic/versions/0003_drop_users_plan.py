"""drop users.plan

Revision ID: 0003_drop_users_plan
Revises: 0002_project_size_bytes
Create Date: 2026-06-16
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_drop_users_plan"
down_revision: Union[str, None] = "0002_project_size_bytes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("users", "plan")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("plan", sa.String(), nullable=False, server_default=sa.text("'free'")),
    )

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.auth import get_current_user
from app.services.db import get_db
from app.services.models import User, MLJob, Project
from app.schemas.job import JobResponse
from app.utils.uuid_helpers import parse_project_id

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MLJob:
    """Returns job status. Ownership verified via project membership."""
    result = await db.execute(
        select(MLJob)
        .join(Project, Project.id == MLJob.project_id)
        .where(MLJob.id == parse_project_id(job_id), Project.user_id == current_user.id)
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

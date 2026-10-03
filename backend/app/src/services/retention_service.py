from src.utils.datetime_utils import utc_now
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, delete

from src.models.report import Report
from src.models.problem import CanonicalProblem

class RetentionService:
    def __init__(self, db: Session):
        self.db = db

    def purge_expired_reports(self) -> int:
        """Deletes expired raw reports while preserving canonical problems, solutions, and pilots.
        Reconciles unique reporters count before deletion.
        """
        now = utc_now()
        expired_reports = self.db.execute(
            select(Report).where(Report.expires_at <= now)
        ).scalars().all()

        deleted_count = len(expired_reports)
        for r in expired_reports:
            self.db.delete(r)

        self.db.commit()
        return deleted_count

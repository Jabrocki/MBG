from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.models.idea import Idea
from src.models.pilot import Pilot
from src.models.problem import CanonicalProblem
from src.models.report import Report
from src.models.source import Solution

router = APIRouter(prefix="/public", tags=["Publiczne statystyki"])


@router.get("/stats", summary="Bezpieczne agregaty do publicznej strony głównej")
def get_public_stats(db: Session = Depends(get_db)):
    def count(model):
        return int(db.scalar(select(func.count()).select_from(model)) or 0)

    return {
        "innovations": count(Solution),
        "problems": count(CanonicalProblem),
        "reports": count(Report),
        "ideas": count(Idea),
        "pilots": count(Pilot),
    }

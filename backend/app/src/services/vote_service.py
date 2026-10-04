from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from src.models.user import User
from src.models.vote import Vote
from src.models.source import Solution, SourceKnowledge
from src.models.problem import CanonicalProblem
from src.models.pilot import Pilot
from src.models.match import MatchResult
from src.schemas.modules import (
    VoteCreateRequest,
    VoteResponse,
    SwipeCardResponse,
)

class VoteService:
    def __init__(self, db: Session):
        self.db = db

    def cast_or_update_vote(self, data: VoteCreateRequest, user: User) -> VoteResponse:
        """Casts or updates a vote. Enforces: 1 current vote per user/solution/local-problem combination."""
        # Weryfikacja istnienia rozwiązania i problemu
        sol = self.db.get(Solution, data.solution_id)
        if not sol:
            raise HTTPException(status_code=404, detail="Rozwiązanie nie zostało odnalezione")
        prob = self.db.get(CanonicalProblem, data.local_problem_id)
        if not prob:
            raise HTTPException(status_code=404, detail="Problem lokalny nie został odnaleziony")
        assigned = self.db.execute(
            select(MatchResult).where(
                MatchResult.problem_id == data.local_problem_id,
                MatchResult.solution_id == data.solution_id,
            )
        ).scalar_one_or_none()
        if not assigned:
            raise HTTPException(status_code=409, detail="To rozwiązanie nie jest przypisane do wskazanego problemu")

        existing_vote = self.db.execute(
            select(Vote).where(
                and_(
                    Vote.user_id == user.id,
                    Vote.solution_id == data.solution_id,
                    Vote.local_problem_id == data.local_problem_id,
                )
            )
        ).scalar_one_or_none()

        if existing_vote:
            # Aktualizacja głosu (np. zmiana zdania z pomijam na popieram lub odwrotnie)
            existing_vote.vote_type = data.vote_type
            existing_vote.rejection_reason = data.rejection_reason
            existing_vote.updated_at = utc_now()
            vote = existing_vote
        else:
            vote = Vote(
                user_id=user.id,
                solution_id=data.solution_id,
                local_problem_id=data.local_problem_id,
                vote_type=data.vote_type,
                rejection_reason=data.rejection_reason,
                created_at=utc_now(),
                updated_at=utc_now(),
            )
            self.db.add(vote)

        self.db.commit()
        self.db.refresh(vote)

        return VoteResponse(
            id=vote.id,
            user_id=vote.user_id,
            solution_id=vote.solution_id,
            local_problem_id=vote.local_problem_id,
            vote_type=vote.vote_type,
            rejection_reason=vote.rejection_reason,
            created_at=vote.created_at,
        )

    def undo_vote(self, vote_id: int, user: User) -> None:
        """Undo/withdraw previous vote."""
        vote = self.db.get(Vote, vote_id)
        if not vote:
            raise HTTPException(status_code=404, detail="Głos nie został odnaleziony")
        if vote.user_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Brak uprawnień do cofnięcia tego głosu")

        self.db.delete(vote)
        self.db.commit()

    def get_cards_for_problem(self, problem_id: int, user: User) -> List[SwipeCardResponse]:
        """Returns eligible swipe cards for local problem, with support counts and badges."""
        if not self.db.get(CanonicalProblem, problem_id):
            raise HTTPException(status_code=404, detail="Problem lokalny nie został odnaleziony")
        solutions = self.db.execute(
            select(Solution)
            .join(MatchResult, MatchResult.solution_id == Solution.id)
            .where(
                MatchResult.problem_id == problem_id,
                # The support/swipe view is for community proposals only.
                # Catalogue innovations remain available in the innovation
                # browser and as AI recommendations, but are not vote cards.
                # Approved community ideas are marked with user-idea:// sources.
                SourceKnowledge.source_url.like("user-idea://%"),
            )
            .join(SourceKnowledge, Solution.source_knowledge_id == SourceKnowledge.id)
            .distinct()
        ).scalars().all()
        cards = []

        for sol in solutions:
            # Oblicz liczbę poparć
            support_count = self.db.execute(
                select(func.count(Vote.id)).where(
                    and_(
                        Vote.solution_id == sol.id,
                        Vote.local_problem_id == problem_id,
                        Vote.vote_type == "support",
                    )
                )
            ).scalar() or 0
            skip_count = self.db.execute(
                select(func.count(Vote.id)).where(
                    and_(
                        Vote.solution_id == sol.id,
                        Vote.local_problem_id == problem_id,
                        Vote.vote_type == "skip",
                    )
                )
            ).scalar() or 0

            # Sprawdź aktualny głos tego użytkownika
            my_vote_rec = self.db.execute(
                select(Vote).where(
                    and_(
                        Vote.user_id == user.id,
                        Vote.solution_id == sol.id,
                        Vote.local_problem_id == problem_id,
                    )
                )
            ).scalar_one_or_none()

            # Cards are restricted to published community ideas above, so they
            # must never be presented as catalogue innovations here.
            pilot = self.db.execute(
                select(Pilot).where(Pilot.solution_id == sol.id)
            ).scalars().first()

            if pilot and pilot.status in ["pilot", "recruitment_funding"]:
                badge = "being_tested"
            else:
                badge = "proposed_idea"

            cards.append(
                SwipeCardResponse(
                    solution_id=sol.id,
                    problem_id=problem_id,
                    title=sol.title,
                    description=sol.description,
                    badge=badge,
                    support_count=support_count,
                    skip_count=skip_count,
                    my_vote=my_vote_rec.vote_type if my_vote_rec else None,
                    my_vote_id=my_vote_rec.id if my_vote_rec else None,
                )
            )

        # Sortuj po liczbie poparć
        cards.sort(key=lambda c: c.support_count, reverse=True)
        return cards

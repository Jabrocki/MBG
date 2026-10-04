from src.utils.datetime_utils import utc_now
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_

from src.models.user import User
from src.models.pilot import Pilot, Volunteer, SatisfactionFeedback
from src.models.discussion import Notification
from src.services.geo_location_service import EntityGeoLocationService
from src.schemas.modules import (
    PilotCreateRequest,
    PilotTransitionRequest,
    PilotResponse,
    VolunteerResponse,
    SatisfactionFeedbackRequest,
    SatisfactionFeedbackResponse,
)

class PilotService:
    def __init__(self, db: Session):
        self.db = db
        self.geo_locations = EntityGeoLocationService(db)

    def create_pilot(self, data: PilotCreateRequest, admin: User) -> PilotResponse:
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Tylko administrator może utworzyć inicjatywę pilotażową")

        pilot = Pilot(
            solution_id=data.solution_id,
            idea_id=data.idea_id,
            title=data.title,
            description=data.description,
            status="draft",
            budget_declared=data.budget_declared,
            partners=data.partners,
            test_plan=data.test_plan,
            max_volunteers=data.max_volunteers,
            created_at=utc_now(),
        )
        self.db.add(pilot)
        self.db.commit()
        self.db.refresh(pilot)
        self.geo_locations.persist_pilot(pilot)
        self.db.commit()
        return self._project_pilot(pilot)

    def list_pilots(self, viewer: User) -> List[PilotResponse]:
        pilots = self.db.execute(
            select(Pilot).order_by(Pilot.created_at.desc())
        ).scalars().all()
        return [self._project_pilot(pilot, viewer) for pilot in pilots]

    def get_pilot(self, pilot_id: int, viewer: User) -> PilotResponse:
        pilot = self.db.get(Pilot, pilot_id)
        if not pilot:
            raise HTTPException(status_code=404, detail="Pilot nie został odnaleziony")
        return self._project_pilot(pilot, viewer)

    def get_my_volunteer_registration(self, pilot_id: int, user: User) -> VolunteerResponse:
        if not self.db.get(Pilot, pilot_id):
            raise HTTPException(status_code=404, detail="Pilot nie został odnaleziony")
        volunteer = self.db.execute(
            select(Volunteer).where(
                and_(Volunteer.pilot_id == pilot_id, Volunteer.user_id == user.id)
            )
        ).scalar_one_or_none()
        if not volunteer:
            raise HTTPException(status_code=404, detail="Nie znaleziono Twojego zgłoszenia do pilotażu")
        return self._project_volunteer(volunteer)

    def list_volunteers(self, pilot_id: int, admin: User) -> List[VolunteerResponse]:
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Tylko administrator może przeglądać listę wolontariuszy")
        if not self.db.get(Pilot, pilot_id):
            raise HTTPException(status_code=404, detail="Pilot nie został odnaleziony")
        volunteers = self.db.execute(
            select(Volunteer)
            .where(Volunteer.pilot_id == pilot_id)
            .order_by(Volunteer.position.asc(), Volunteer.created_at.asc())
        ).scalars().all()
        return [self._project_volunteer(volunteer) for volunteer in volunteers]

    def transition_status(self, pilot_id: int, data: PilotTransitionRequest, admin: User) -> PilotResponse:
        """Transitions pilot lifecycle. Enforces preconditions for 'pilot' start."""
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Tylko administrator może zarządzać statusem pilota")

        pilot = self.db.get(Pilot, pilot_id)
        if not pilot:
            raise HTTPException(status_code=404, detail="Pilot nie został odnaleziony")

        # Aktualizacja zatwierdzonego budżetu, właściciela, partnerów i planu jeśli podano
        if data.budget_approved is not None:
            pilot.budget_approved = data.budget_approved
        if data.accountable_owner is not None:
            pilot.accountable_owner = data.accountable_owner
        if data.partners is not None:
            pilot.partners = data.partners
        if data.test_plan is not None:
            pilot.test_plan = data.test_plan

        # PRECONDITION CHECK dla przejścia w stan 'pilot' (start):
        if data.target_status == "pilot":
            errors = []
            if not pilot.budget_approved or pilot.budget_approved <= 0:
                errors.append("Wymagany jest zatwierdzony budżet (budget_approved > 0)")
            if not pilot.accountable_owner:
                errors.append("Wymagany jest wyznaczony odpowiedzialny właściciel (accountable_owner)")
            if not pilot.partners:
                errors.append("Wymagani są zdefiniowani partnerzy wdrożeniowi")
            if not pilot.test_plan:
                errors.append("Wymagany jest przygotowany plan testów (test_plan)")

            accepted_volunteers = self.db.execute(
                select(func.count(Volunteer.id)).where(
                    and_(
                        Volunteer.pilot_id == pilot.id,
                        Volunteer.status == "accepted",
                    )
                )
            ).scalar() or 0

            if accepted_volunteers == 0 and pilot.max_volunteers > 0:
                errors.append("Wymagani są potwierdzeni uczestnicy/wolontariusze przed startem pilotażu")

            if errors:
                raise HTTPException(
                    status_code=422,
                    detail=f"Nie można uruchomić pilotażu. Niespełnione kryteria startu: {'; '.join(errors)}"
                )

        pilot.status = data.target_status
        self.db.commit()
        self.db.refresh(pilot)
        return self._project_pilot(pilot)

    def register_volunteer(self, pilot_id: int, user: User) -> VolunteerResponse:
        """Registers volunteer. Places in registered or waiting list depending on capacity."""
        pilot = self.db.get(Pilot, pilot_id)
        if not pilot:
            raise HTTPException(status_code=404, detail="Pilot nie został odnaleziony")

        existing = self.db.execute(
            select(Volunteer).where(
                and_(Volunteer.pilot_id == pilot_id, Volunteer.user_id == user.id)
            )
        ).scalar_one_or_none()

        if existing and existing.status in ["registered", "waiting", "offered", "accepted"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Użytkownik jest już zarejestrowany w tym projekcie"
            )

        active_count = self.db.execute(
            select(func.count(Volunteer.id)).where(
                and_(
                    Volunteer.pilot_id == pilot_id,
                    Volunteer.status.in_(["accepted", "offered", "registered"]),
                )
            )
        ).scalar() or 0

        # Jeśli limit miejsc osiągnięty, trafia na listę oczekujących
        if active_count >= pilot.max_volunteers:
            waiting_count = self.db.execute(
                select(func.count(Volunteer.id)).where(
                    and_(Volunteer.pilot_id == pilot_id, Volunteer.status == "waiting")
                )
            ).scalar() or 0
            status_val = "waiting"
            pos = waiting_count + 1
        else:
            status_val = "registered"
            pos = 0

        if existing:
            existing.status = status_val
            existing.position = pos
            vol = existing
        else:
            vol = Volunteer(
                pilot_id=pilot_id,
                user_id=user.id,
                status=status_val,
                position=pos,
                created_at=utc_now(),
            )
            self.db.add(vol)

        self.db.commit()
        self.db.refresh(vol)
        return self._project_volunteer(vol)

    def cancel_volunteer(self, pilot_id: int, user: User) -> None:
        """Cancels volunteer registration and immediately notifies next person from waiting list."""
        vol = self.db.execute(
            select(Volunteer).where(
                and_(Volunteer.pilot_id == pilot_id, Volunteer.user_id == user.id)
            )
        ).scalar_one_or_none()

        if not vol:
            raise HTTPException(status_code=404, detail="Nie znaleziono rejestracji wolontariusza")

        prev_status = vol.status
        vol.status = "cancelled"
        self.db.commit()

        # Jeśli zwolniono miejsce zajęte, promujemy pierwszą osobę z waiting list
        if prev_status in ["accepted", "offered", "registered"]:
            self._offer_next_waiting_volunteer(pilot_id)

    def accept_place_offer(self, pilot_id: int, user: User) -> VolunteerResponse:
        """Volunteer accepts the offered place. Protected against oversubscription via DB row lock."""
        pilot = self.db.execute(
            select(Pilot).where(Pilot.id == pilot_id).with_for_update()
        ).scalar_one_or_none()

        if not pilot:
            raise HTTPException(status_code=404, detail="Pilot nie został odnaleziony")

        vol = self.db.execute(
            select(Volunteer).where(
                and_(Volunteer.pilot_id == pilot_id, Volunteer.user_id == user.id)
            ).with_for_update()
        ).scalar_one_or_none()

        if not vol or vol.status not in ["offered", "registered"]:
            raise HTTPException(
                status_code=400,
                detail="Brak aktywnej oferty miejsca dla tego użytkownika"
            )

        # Sprawdź czy nie ma przekroczenia limitu
        accepted_count = self.db.execute(
            select(func.count(Volunteer.id)).where(
                and_(Volunteer.pilot_id == pilot_id, Volunteer.status == "accepted")
            )
        ).scalar() or 0

        if accepted_count >= pilot.max_volunteers:
            vol.status = "waiting"
            self.db.commit()
            raise HTTPException(
                status_code=409,
                detail="Wszystkie miejsca zostały już zajęte. Zostałeś przesunięty na listę oczekujących."
            )

        vol.status = "accepted"
        vol.accepted_at = utc_now()
        self.db.commit()
        self.db.refresh(vol)
        return self._project_volunteer(vol)

    def manual_promote_volunteer(self, pilot_id: int, target_user_id: int, admin: User) -> VolunteerResponse:
        """Administrator manually promotes volunteer from waiting list to offered."""
        if admin.role != "admin":
            raise HTTPException(status_code=403, detail="Tylko administrator może ręcznie promować wolontariusza")

        pilot = self.db.get(Pilot, pilot_id)
        if not pilot:
            raise HTTPException(status_code=404, detail="Pilot nie został odnaleziony")

        vol = self.db.execute(
            select(Volunteer).where(
                and_(Volunteer.pilot_id == pilot_id, Volunteer.user_id == target_user_id)
            )
        ).scalar_one_or_none()

        if not vol:
            raise HTTPException(status_code=404, detail="Wolontariusz nie został odnaleziony")
        if vol.status != "waiting":
            raise HTTPException(status_code=409, detail="Ofertę można przekazać wyłącznie osobie z listy oczekujących")

        active_count = self.db.execute(
            select(func.count(Volunteer.id)).where(
                and_(
                    Volunteer.pilot_id == pilot_id,
                    Volunteer.status.in_(["accepted", "offered", "registered"]),
                )
            )
        ).scalar() or 0
        if active_count >= pilot.max_volunteers:
            raise HTTPException(status_code=409, detail="Brak wolnego miejsca w pilotażu")

        vol.status = "offered"
        vol.offered_at = utc_now()

        # Powiadomienie in-app
        notif = Notification(
            user_id=target_user_id,
            title="Dostępne miejsce w projekcie pilotażowym",
            message="Administrator zaoferował Ci miejsce w projekcie. Kliknij, aby potwierdzić uczestnictwo.",
            link=f"/pilots/{pilot_id}",
            created_at=utc_now(),
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(vol)
        return self._project_volunteer(vol)

    def add_satisfaction_feedback(
        self,
        pilot_id: int,
        data: SatisfactionFeedbackRequest,
        user: User
    ) -> SatisfactionFeedbackResponse:
        pilot = self.db.get(Pilot, pilot_id)
        if not pilot:
            raise HTTPException(status_code=404, detail="Pilot nie został odnaleziony")

        feedback = SatisfactionFeedback(
            pilot_id=pilot_id,
            user_id=user.id,
            role=data.role,
            rating=data.rating,
            comment=data.comment,
            improvements=data.improvements,
            created_at=utc_now(),
        )
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)

        return SatisfactionFeedbackResponse(
            id=feedback.id,
            pilot_id=feedback.pilot_id,
            user_id=feedback.user_id,
            role=feedback.role,
            rating=feedback.rating,
            comment=feedback.comment,
            improvements=feedback.improvements,
            created_at=feedback.created_at,
        )

    def _offer_next_waiting_volunteer(self, pilot_id: int) -> None:
        next_vol = self.db.execute(
            select(Volunteer)
            .where(and_(Volunteer.pilot_id == pilot_id, Volunteer.status == "waiting"))
            .order_by(Volunteer.position.asc(), Volunteer.created_at.asc())
        ).scalars().first()

        if next_vol:
            next_vol.status = "offered"
            next_vol.offered_at = utc_now()
            # Wyślij in-app powiadomienie
            notif = Notification(
                user_id=next_vol.user_id,
                title="Zwolniło się miejsce w projekcie!",
                message="Miejsce w projekcie pilotażowym czeka na Ciebie. Potwierdź swój udział w aplikacji.",
                link=f"/pilots/{pilot_id}",
                created_at=utc_now(),
            )
            self.db.add(notif)
            self.db.commit()

    def _project_pilot(self, pilot: Pilot, viewer: Optional[User] = None) -> PilotResponse:
        registered = self.db.execute(
            select(func.count(Volunteer.id)).where(
                and_(Volunteer.pilot_id == pilot.id, Volunteer.status.in_(["accepted", "registered"]))
            )
        ).scalar() or 0

        waiting = self.db.execute(
            select(func.count(Volunteer.id)).where(
                and_(Volunteer.pilot_id == pilot.id, Volunteer.status == "waiting")
            )
        ).scalar() or 0

        my_volunteer = None
        if viewer:
            my_volunteer = self.db.execute(
                select(Volunteer).where(
                    and_(Volunteer.pilot_id == pilot.id, Volunteer.user_id == viewer.id)
                )
            ).scalar_one_or_none()

        return PilotResponse(
            id=pilot.id,
            solution_id=pilot.solution_id,
            idea_id=pilot.idea_id,
            canonical_problem_id=pilot.idea.canonical_problem_id if pilot.idea else None,
            title=pilot.title,
            description=pilot.description,
            status=pilot.status,
            budget_declared=pilot.budget_declared,
            budget_approved=pilot.budget_approved,
            accountable_owner=pilot.accountable_owner,
            partners=pilot.partners,
            test_plan=pilot.test_plan,
            max_volunteers=pilot.max_volunteers,
            registered_volunteers_count=registered,
            waiting_list_count=waiting,
            my_volunteer_status=my_volunteer.status if my_volunteer else None,
            my_volunteer_position=my_volunteer.position if my_volunteer else None,
            created_at=pilot.created_at,
        )

    def _project_volunteer(self, vol: Volunteer) -> VolunteerResponse:
        user_name = f"{vol.user.name} {vol.user.surname}".strip() if vol.user else None
        return VolunteerResponse(
            id=vol.id,
            pilot_id=vol.pilot_id,
            user_id=vol.user_id,
            user_name=user_name,
            status=vol.status,
            skills_confirmed=vol.skills_confirmed,
            position=vol.position,
            offered_at=vol.offered_at,
            accepted_at=vol.accepted_at,
            created_at=vol.created_at,
        )

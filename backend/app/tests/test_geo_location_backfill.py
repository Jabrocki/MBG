from datetime import timedelta

from sqlalchemy import select

from src.models.geo_location import EntityGeoLocation
from src.models.pilot import Pilot
from src.models.problem import CanonicalProblem
from src.models.report import Report
from src.models.source import Solution, SourceKnowledge
from src.models.user import User
from src.services.geo_location_service import EntityGeoLocationService
from src.utils.datetime_utils import utc_now


def test_generic_location_backfill_persists_reports_problems_innovations_and_pilots(db_session):
    reporter = User(name="Geo", surname="Tester", email="geo@example.test", role="user")
    db_session.add(reporter)
    source = SourceKnowledge(
        source_url="https://example.test/krakow",
        title="Program sąsiedzki",
        content_summary="# Program\n\n## Lokalizacja\n\nKraków, Podgórze",
        category="Seniorzy",
        provenance_metadata={"rejon": "Kraków"},
    )
    db_session.add(source)
    db_session.flush()
    located_innovation = Solution(
        source_knowledge_id=source.id,
        title="Sąsiedzkie wsparcie seniorów",
        description="Rozwiązanie rozwijane w Krakowie.",
    )
    unlocated_innovation = Solution(
        title="Metodyka ogólnokrajowa",
        description="Nie wskazano miejscowości ani punktu realizacji.",
    )
    db_session.add_all([located_innovation, unlocated_innovation])
    db_session.flush()

    report = Report(
        author_id=reporter.id,
        text_raw="Brakuje bezpiecznej przestrzeni spotkań.",
        location_lat=49.9871,
        location_lon=20.0647,
        location_type="map",
        location_name="Wieliczka",
        categories=["Seniorzy"],
        audience="Mieszkańcy",
        urgency="standard",
        duration="nieznany",
        is_urgent=False,
        status="confirmed",
        expires_at=utc_now() + timedelta(days=30),
    )
    problem = CanonicalProblem(
        title="Brak spotkań dla seniorów",
        generated_description="Zagregowany opis potrzeby.",
        reporter_count=1,
        location_centroid_lat=49.9871,
        location_centroid_lon=20.0647,
        status="active",
    )
    db_session.add_all([report, problem])
    db_session.flush()
    report.canonical_problem_id = problem.id
    located_pilot = Pilot(
        solution_id=located_innovation.id,
        title="Pilotaż wsparcia sąsiedzkiego",
        description="Test lokalnego modelu.",
        max_volunteers=5,
    )
    unlocated_pilot = Pilot(
        solution_id=unlocated_innovation.id,
        title="Pilotaż bez wskazanej miejscowości",
        description="Bez lokalizacji.",
        max_volunteers=5,
    )
    db_session.add_all([located_pilot, unlocated_pilot])
    db_session.commit()

    service = EntityGeoLocationService(db_session)
    stats = service.backfill_all()

    locations = {
        (row.entity_type, row.entity_id): row
        for row in db_session.execute(select(EntityGeoLocation)).scalars()
    }
    report_location = locations[("report", report.id)]
    assert (report_location.latitude, report_location.longitude, report_location.locality) == (49.9871, 20.0647, "Wieliczka")
    assert report_location.precision == "exact"

    problem_location = locations[("problem", problem.id)]
    assert (problem_location.latitude, problem_location.longitude) == (49.9871, 20.0647)
    assert problem_location.precision == "aggregate"

    innovation_location = locations[("innovation", located_innovation.id)]
    assert (innovation_location.latitude, innovation_location.longitude) == (50.0619, 19.9368)
    assert innovation_location.locality == "Kraków, Podgórze"
    assert innovation_location.source_knowledge_id == source.id

    pilot_location = locations[("pilot", located_pilot.id)]
    assert (pilot_location.latitude, pilot_location.longitude) == (50.0619, 19.9368)
    assert pilot_location.locality == "Kraków, Podgórze"
    assert ("innovation", unlocated_innovation.id) not in locations
    assert ("pilot", unlocated_pilot.id) not in locations
    assert stats["report"]["created"] >= 1
    assert stats["problem"]["created"] >= 1
    assert stats["innovation"]["created"] >= 1
    assert stats["pilot"]["created"] >= 1

    # A repeat never duplicates a generic entity location.
    second_stats = service.backfill_all()
    assert second_stats["report"]["unchanged"] >= 1
    assert len(db_session.execute(select(EntityGeoLocation)).scalars().all()) == len(locations)

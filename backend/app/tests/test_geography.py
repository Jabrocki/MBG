from datetime import timedelta

from src.models.report import Report
from src.models.source import Solution, SourceKnowledge
from src.models.user import DemoSession, User
from src.services.geo_location_service import EntityGeoLocationService
from src.utils.datetime_utils import utc_now


def _create_confirmed_problem(user_client) -> tuple[int, int]:
    report_response = user_client.post(
        "/api/v1/reports",
        json={
            "text": "Brakuje bezpiecznych spotkań dla samotnych seniorów w Krakowie.",
            "location_lat": 50.0647,
            "location_lon": 19.9450,
            "location_type": "map",
            "location_name": "Kraków",
        },
    )
    assert report_response.status_code == 200
    report_id = report_response.json()["report"]["id"]

    problem_response = user_client.post(
        f"/api/v1/reports/{report_id}/confirm-grouping",
        json={"create_new": True},
    )
    assert problem_response.status_code == 200
    return report_id, problem_response.json()["id"]


def test_map_returns_private_reports_and_privacy_rounded_problem(user_client):
    report_id, problem_id = _create_confirmed_problem(user_client)

    response = user_client.get(
        "/api/v1/map/markers",
        params={"lat": 50.0647, "lon": 19.9450, "radius_km": 5},
    )
    assert response.status_code == 200
    payload = response.json()
    markers = {marker["id"]: marker for marker in payload["markers"]}

    # An author can see their own report's precise location, but the map response
    # contains no report content or author name.
    own_report = markers[f"report:{report_id}"]
    assert own_report["visibility"] == "private"
    assert own_report["precision"] == "exact"
    assert own_report["lat"] == 50.0647
    assert "samotnych seniorów" not in own_report["title"]

    # A one-reporter canonical problem is a shared marker, so its pin is rounded
    # to an area rather than leaking the raw submitted point.
    problem = markers[f"problem:{problem_id}"]
    assert problem["visibility"] == "authenticated"
    assert problem["precision"] == "area"
    assert problem["lat"] == 50.06
    assert problem["lon"] == 19.95
    assert problem["reporter_count"] == 1
    assert payload["center"] == {"lat": 50.0647, "lon": 19.945}
    assert "Dokładne punkty" in payload["privacy_note"]


def test_map_hides_other_users_reports_but_allows_admin_review(user_client, client, db_session):
    foreign_user = User(name="Inna", surname="Osoba", email="inna@demo.hubmi.pl", role="user")
    db_session.add(foreign_user)
    db_session.flush()
    administrator = User(name="Admin", surname="Mapy", email="admin-map@demo.hubmi.pl", role="admin")
    db_session.add(administrator)
    db_session.flush()
    db_session.add(DemoSession(token="map-test-admin-token", user_id=administrator.id))
    foreign_report = Report(
        author_id=foreign_user.id,
        text_raw="Prywatne zgłoszenie drugiej osoby.",
        location_lat=49.6216,
        location_lon=20.6971,
        location_type="map",
        location_name="Nowy Sącz",
        categories=["Seniorzy"],
        audience="Mieszkańcy",
        urgency="standard",
        duration="nieznany",
        is_urgent=False,
        status="submitted",
        expires_at=utc_now() + timedelta(days=30),
    )
    db_session.add(foreign_report)
    db_session.commit()

    user_payload = user_client.get("/api/v1/map/markers").json()
    user_ids = {marker["id"] for marker in user_payload["markers"]}
    assert f"report:{foreign_report.id}" not in user_ids

    client.headers["Authorization"] = "Bearer map-test-admin-token"
    admin_response = client.get("/api/v1/map/markers")
    assert admin_response.status_code == 200
    admin_markers = {marker["id"]: marker for marker in admin_response.json()["markers"]}
    reviewed_report = admin_markers[f"report:{foreign_report.id}"]
    assert reviewed_report["visibility"] == "admin"
    assert reviewed_report["precision"] == "exact"
    assert reviewed_report["title"] == f"Zgłoszenie #{foreign_report.id}"
    assert "Prywatne zgłoszenie" not in reviewed_report["title"]


def test_map_geocodes_only_recognised_source_localities_and_validates_query(user_client, client, db_session):
    source = SourceKnowledge(
        source_url="https://example.test/krakow-seniorzy",
        title="Program dla seniorów w Krakowie",
        content_summary="## Lokalizacja\nKraków, Podgórze",
        category="Seniorzy",
        provenance_metadata={"rejon": "Kraków"},
    )
    db_session.add(source)
    db_session.flush()
    mapped_solution = Solution(
        source_knowledge_id=source.id,
        title="Krakowski program sąsiedzki",
        description="# Program\n\n## Lokalizacja\n\nKraków, Podgórze",
    )
    unknown_solution = Solution(
        title="Ogólnopolska metodologia wsparcia",
        description="Model nie przypisuje programu do konkretnej miejscowości.",
    )
    db_session.add_all([mapped_solution, unknown_solution])
    db_session.commit()
    EntityGeoLocationService(db_session).backfill_all()

    response = user_client.get("/api/v1/map/markers", params={"lat": 50.0619, "lon": 19.9368, "radius_km": 2})
    assert response.status_code == 200
    markers = {marker["id"]: marker for marker in response.json()["markers"]}
    innovation = markers[f"innovation:{mapped_solution.id}"]
    assert innovation["precision"] == "municipality"
    assert innovation["location_name"] == "Kraków, Podgórze"
    assert innovation["lat"] == 50.0619
    assert innovation["source_url"] == "https://example.test/krakow-seniorzy"
    assert f"innovation:{unknown_solution.id}" not in markers
    assert response.json()["counts"]["innovations_without_known_location"] >= 1

    assert client.get("/api/v1/map/markers").status_code == 401
    invalid = user_client.get("/api/v1/map/markers", params={"lat": 50.0})
    assert invalid.status_code == 422

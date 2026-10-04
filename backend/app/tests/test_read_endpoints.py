import secrets

from src.models.discussion import Notification
from src.models.user import DemoSession, User


def test_public_statistics_are_aggregated_from_persisted_tables(client):
    response = client.get('/api/v1/public/stats')
    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {'innovations', 'problems', 'reports', 'ideas', 'pilots'}
    assert all(isinstance(value, int) and value >= 0 for value in payload.values())


def _authenticate(client, db_session, *, email: str, role: str = "user") -> User:
    user = User(
        name="Test",
        surname=role,
        email=email,
        role=role,
        is_anonymous_by_default=True,
    )
    db_session.add(user)
    db_session.flush()
    token = secrets.token_hex(24)
    db_session.add(DemoSession(token=token, user_id=user.id))
    db_session.commit()
    client.headers["Authorization"] = f"Bearer {token}"
    return user


def test_idea_detail_and_mine_keep_private_drafts_private(user_client, client, db_session):
    created = user_client.post(
        "/api/v1/ideas",
        json={
                "text_raw": "Sąsiedzki program wspólnych spacerów dla seniorów w Krakowie.",
                "canonical_problem_id": 1,
            "need": "Mniej samotności seniorów.",
        },
    )
    assert created.status_code == 200
    idea_id = created.json()["id"]

    mine = user_client.get("/api/v1/ideas/mine")
    assert mine.status_code == 200
    assert [idea["id"] for idea in mine.json()] == [idea_id]

    detail = user_client.get(f"/api/v1/ideas/{idea_id}")
    assert detail.status_code == 200
    assert detail.json()["status"] == "private_draft"

    # The author can read their own draft thread.  A different account cannot use the
    # thread endpoint to discover an otherwise private idea.
    thread = user_client.get(f"/api/v1/ideas/{idea_id}/thread")
    assert thread.status_code == 200
    other = _authenticate(client, db_session, email="other-idea@example.test")
    assert client.get(f"/api/v1/ideas/{idea_id}").status_code == 404
    assert client.get(f"/api/v1/ideas/{idea_id}/thread").status_code == 404
    assert client.post(f"/api/v1/threads/{thread.json()['id']}/messages", json={"content": "Nieuprawnione"}).status_code == 404


def test_pilot_list_detail_and_refreshed_volunteer_state(user_client, client, db_session):
    _authenticate(client, db_session, email="admin-pilot@example.test", role="admin")
    created = client.post(
        "/api/v1/pilots",
        json={
            "solution_id": 1,
            "title": "Pilotaż wsparcia sąsiedzkiego",
            "description": "Test lokalnego wsparcia seniorów.",
            "budget_declared": 12000,
            "max_volunteers": 3,
        },
    )
    assert created.status_code == 200
    pilot_id = created.json()["id"]

    listing = user_client.get("/api/v1/pilots")
    assert listing.status_code == 200
    listed = next(pilot for pilot in listing.json() if pilot["id"] == pilot_id)
    assert listed["solution_id"] == 1
    assert listed["my_volunteer_status"] is None

    registration = user_client.post(f"/api/v1/pilots/{pilot_id}/volunteer")
    assert registration.status_code == 200
    assert registration.json()["status"] == "registered"

    detail = user_client.get(f"/api/v1/pilots/{pilot_id}")
    assert detail.status_code == 200
    assert detail.json()["my_volunteer_status"] == "registered"
    assert detail.json()["my_volunteer_position"] == 0

    refreshed_registration = user_client.get(f"/api/v1/pilots/{pilot_id}/volunteer")
    assert refreshed_registration.status_code == 200
    assert refreshed_registration.json()["id"] == registration.json()["id"]
    assert user_client.get("/api/v1/pilots/999999").status_code == 404


def test_adaptation_reads_and_notifications_are_scoped_to_the_session(user_client, client, db_session):
    catalogue_item = user_client.get("/api/v1/catalogue/1")
    assert catalogue_item.status_code == 200
    assert catalogue_item.json()["title"] == "Bawita - Międzypokoleniowa Bawialnia"
    assert user_client.get("/api/v1/catalogue/999999").status_code == 404

    created = user_client.post(
        "/api/v1/adaptations",
        json={
            "solution_id": 1,
            "beneficiaries": "Seniorzy z gminy",
            "location": "Wieliczka",
            "resources": "Sala i dwóch wolontariuszy",
            "budget": "5000 zł",
            "constraints": "Dostępność architektoniczna",
        },
    )
    assert created.status_code == 200
    adaptation_id = created.json()["id"]
    assert created.json()["solution_title"] == "Bawita - Międzypokoleniowa Bawialnia"

    own_list = user_client.get("/api/v1/adaptations/mine")
    assert own_list.status_code == 200
    assert [adaptation["id"] for adaptation in own_list.json()] == [adaptation_id]
    assert user_client.get(f"/api/v1/adaptations/{adaptation_id}").status_code == 200

    other = _authenticate(client, db_session, email="other-adaptation@example.test")
    assert client.get(f"/api/v1/adaptations/{adaptation_id}").status_code == 403
    assert client.get("/api/v1/adaptations/mine").json() == []

    notification = Notification(
        user_id=other.id,
        title="Oferta miejsca",
        message="Możesz odpowiedzieć w aplikacji.",
        link="/pilotaze/1/udzial",
    )
    db_session.add(notification)
    db_session.commit()
    notifications = client.get("/api/v1/notifications")
    assert notifications.status_code == 200
    assert notifications.json()[0]["id"] == notification.id
    assert notifications.json()[0]["is_read"] is False

    _authenticate(client, db_session, email="admin-adaptation@example.test", role="admin")
    admin_list = client.get("/api/v1/adaptations/mine")
    assert admin_list.status_code == 200
    assert any(adaptation["id"] == adaptation_id for adaptation in admin_list.json())
    assert client.get(f"/api/v1/adaptations/{adaptation_id}").status_code == 200

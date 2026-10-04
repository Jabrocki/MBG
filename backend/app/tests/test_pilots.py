def _create_pilot(admin_client, *, max_volunteers=1):
    response = admin_client.post(
        "/api/v1/pilots",
        json={
            "title": "Pilotaż wsparcia sąsiedzkiego",
            "description": "Test przepływu udziału mieszkańców.",
            "budget_declared": 15000.0,
            "max_volunteers": max_volunteers,
        },
    )
    assert response.status_code == 200
    return response.json()["id"]


def test_pilot_list_and_detail_include_only_current_users_participation(user_client, admin_client):
    pilot_id = _create_pilot(admin_client)

    listed = user_client.get("/api/v1/pilots")
    assert listed.status_code == 200
    pilot = next(item for item in listed.json() if item["id"] == pilot_id)
    assert pilot["title"] == "Pilotaż wsparcia sąsiedzkiego"
    assert pilot["my_volunteer_status"] is None

    detail_before = user_client.get(f"/api/v1/pilots/{pilot_id}")
    assert detail_before.status_code == 200
    assert detail_before.json()["registered_volunteers_count"] == 0

    registered = user_client.post(f"/api/v1/pilots/{pilot_id}/volunteer")
    assert registered.status_code == 200
    assert registered.json()["status"] == "registered"

    detail_after = user_client.get(f"/api/v1/pilots/{pilot_id}")
    assert detail_after.status_code == 200
    assert detail_after.json()["my_volunteer_status"] == "registered"
    assert detail_after.json()["registered_volunteers_count"] == 1

    accepted = user_client.post(f"/api/v1/pilots/{pilot_id}/accept-offer")
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"

    feedback = user_client.post(
        f"/api/v1/pilots/{pilot_id}/feedback",
        json={
            "role": "volunteer",
            "rating": 5,
            "comment": "Działania były dobrze przygotowane.",
            "improvements": "Warto dodać więcej terminów.",
        },
    )
    assert feedback.status_code == 200
    assert feedback.json()["rating"] == 5


def test_cancellation_promotes_waiting_volunteer_to_offer_and_can_be_accepted(user_client, admin_client):
    pilot_id = _create_pilot(admin_client, max_volunteers=1)
    primary_token = user_client.headers["Authorization"]

    first = user_client.post(f"/api/v1/pilots/{pilot_id}/volunteer")
    assert first.status_code == 200
    assert first.json()["status"] == "registered"

    second_session = user_client.post(
        "/api/v1/auth/register",
        json={
            "name": "Alicja",
            "surname": "Testowa",
            "email": "alicja.pilot@example.test",
            "password": "Bezpieczne2026",
            "is_anonymous_by_default": True,
        },
    )
    assert second_session.status_code == 201
    second_token = f"Bearer {second_session.json()['access_token']}"
    user_client.headers["Authorization"] = second_token

    waiting = user_client.post(f"/api/v1/pilots/{pilot_id}/volunteer")
    assert waiting.status_code == 200
    assert waiting.json()["status"] == "waiting"
    assert waiting.json()["position"] == 1

    user_client.headers["Authorization"] = primary_token
    cancelled = user_client.delete(f"/api/v1/pilots/{pilot_id}/volunteer")
    assert cancelled.status_code == 204

    user_client.headers["Authorization"] = second_token
    offered = user_client.get(f"/api/v1/pilots/{pilot_id}")
    assert offered.status_code == 200
    assert offered.json()["my_volunteer_status"] == "offered"

    accepted = user_client.post(f"/api/v1/pilots/{pilot_id}/accept-offer")
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"


def test_pilot_start_requires_complete_conditions(user_client, admin_client):
    pilot_id = _create_pilot(admin_client)

    blocked = admin_client.post(
        f"/api/v1/pilots/{pilot_id}/transition",
        json={"target_status": "pilot"},
    )
    assert blocked.status_code == 422
    assert "Niespełnione kryteria startu" in blocked.json()["detail"]

    registered = user_client.post(f"/api/v1/pilots/{pilot_id}/volunteer")
    assert registered.status_code == 200
    assert user_client.post(f"/api/v1/pilots/{pilot_id}/accept-offer").status_code == 200

    started = admin_client.post(
        f"/api/v1/pilots/{pilot_id}/transition",
        json={
            "target_status": "pilot",
            "budget_approved": 15000.0,
            "accountable_owner": "Koordynator",
            "partners": "Partner lokalny",
            "test_plan": "Plan testów",
        },
    )
    assert started.status_code == 200
    assert started.json()["status"] == "pilot"

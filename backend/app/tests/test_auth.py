def test_demo_login_user(client):
    response = client.post("/api/v1/auth/demo", json={"role": "user"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "user"
    assert "Jan Kowalski" in data["user_name"]

def test_demo_login_admin(client):
    response = client.post("/api/v1/auth/demo", json={"role": "admin"})
    assert response.status_code == 403

def test_demo_login_invalid_role(client):
    response = client.post("/api/v1/auth/demo", json={"role": "superuser"})
    assert response.status_code == 400

def test_me_endpoint_requires_auth(client):
    client.headers.pop("Authorization", None)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_register_login_and_logout_user_account(client):
    registration = {
        "name": "Alicja",
        "surname": "Testowa",
        "email": "alicja@example.test",
        "password": "Bezpieczne2026",
        "is_anonymous_by_default": True,
    }
    response = client.post("/api/v1/auth/register", json=registration)
    assert response.status_code == 201
    created = response.json()
    assert created["role"] == "user"
    assert created["user_name"] == "Alicja Testowa"

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {created['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == "alicja@example.test"

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "ALICJA@EXAMPLE.TEST", "password": registration["password"]},
    )
    assert login.status_code == 200
    assert login.json()["role"] == "user"

    token = login.json()["access_token"]
    logout = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout.status_code == 204
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_registration_cannot_create_admin_and_rejects_weak_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Ewa",
            "surname": "Testowa",
            "email": "ewa@example.test",
            "password": "za-krotkie",
            "role": "admin",
        },
    )
    assert response.status_code == 400
    assert "Hasło" in response.json()["detail"]

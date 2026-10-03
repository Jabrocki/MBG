def test_demo_login_user(client):
    response = client.post("/api/v1/auth/demo", json={"role": "user"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "user"
    assert "Jan Kowalski" in data["user_name"]

def test_demo_login_admin(client):
    response = client.post("/api/v1/auth/demo", json={"role": "admin"})
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "admin"

def test_demo_login_invalid_role(client):
    response = client.post("/api/v1/auth/demo", json={"role": "superuser"})
    assert response.status_code == 400

def test_me_endpoint_requires_auth(client):
    client.headers.pop("Authorization", None)
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

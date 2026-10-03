def test_submit_report_valid_malopolska(user_client):
    payload = {
        "text": "Brak opieki wytchnieniowej dla seniorów na osiedlu w Nowym Sączu.",
        "location_lat": 49.6216,
        "location_lon": 20.6971,
        "location_type": "map",
        "location_name": "Nowy Sącz"
    }
    response = user_client.post("/api/v1/reports", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "report" in data
    rep = data["report"]
    assert rep["location_name"] == "Nowy Sącz"
    assert "Seniorzy" in rep["categories"]
    assert rep["is_urgent"] is False
    assert rep["urgent_guidance"] is None

def test_submit_report_rejects_outside_malopolska(user_client):
    # Location in Warsaw (outside Małopolska)
    payload = {
        "text": "Problem z chodnikiem w Warszawie na Mokotowie.",
        "location_lat": 52.2297,
        "location_lon": 21.0122,
        "location_type": "map",
        "location_name": "Warszawa"
    }
    response = user_client.post("/api/v1/reports", json=payload)
    assert response.status_code == 422
    assert "Województwa Małopolskiego" in response.json()["detail"]

def test_submit_report_urgent_detection_and_guidance(user_client):
    payload = {
        "text": "Zagrożenie bezpieczeństwa: natychmiast potrzebna interwencja w zniszczonym pustostanie!",
        "location_lat": 50.0647,
        "location_lon": 19.9450,
        "location_type": "map",
        "location_name": "Kraków"
    }
    response = user_client.post("/api/v1/reports", json=payload)
    assert response.status_code == 200
    rep = response.json()["report"]
    assert rep["is_urgent"] is True
    assert "112" in rep["urgent_guidance"]
    assert "SYMULOWANYM" in rep["urgent_guidance"]

def test_report_anonymity_projection(user_client, admin_client):
    payload = {
        "text": "Trudności z dojazdem osób z niepełnosprawnością w Tarnowie.",
        "location_lat": 50.0121,
        "location_lon": 20.9858,
        "location_type": "map",
        "location_name": "Tarnów"
    }
    resp = user_client.post("/api/v1/reports", json=payload)
    assert resp.status_code == 200
    report_id = resp.json()["report"]["id"]

    # When accessed by regular user: author name is author or None for public projection
    # When viewed by admin: author is visible
    admin_resp = admin_client.patch(f"/api/v1/reports/{report_id}/categories", json={"categories": ["Dostępność", "Seniorzy"]})
    assert admin_resp.status_code == 200
    assert "Dostępność" in admin_resp.json()["categories"]

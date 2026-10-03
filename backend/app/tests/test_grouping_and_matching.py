def test_confirm_grouping_creates_canonical_problem(user_client):
    # 1. Zgłoszenie
    resp = user_client.post("/api/v1/reports", json={
        "text": "Brak oferty zajęć integracyjnych dla dzieci ze spektrum autyzmu w Wieliczce.",
        "location_lat": 49.9871,
        "location_lon": 20.0647,
        "location_type": "map",
        "location_name": "Wieliczka"
    })
    assert resp.status_code == 200
    report_id = resp.json()["report"]["id"]

    # 2. Potwierdzenie jako nowy problem
    conf_resp = user_client.post(f"/api/v1/reports/{report_id}/confirm-grouping", json={
        "create_new": True,
        "confirmed_problem_id": None
    })
    assert conf_resp.status_code == 200
    problem = conf_resp.json()
    assert problem["reporter_count"] == 1
    assert "HyDE" in problem["generated_description"] or len(problem["generated_description"]) > 10
    problem_id = problem["id"]

    # 3. Drugie zgłoszenie tego samego użytkownika na ten sam problem
    resp2 = user_client.post("/api/v1/reports", json={
        "text": "Dodatkowy komentarz do braku zajęć dla dzieci w Wieliczce.",
        "location_lat": 49.9871,
        "location_lon": 20.0647,
        "location_type": "map",
        "location_name": "Wieliczka"
    })
    assert resp2.status_code == 200
    report2_id = resp2.json()["report"]["id"]

    # Powiązanie z istniejącym problemem przez tego samego użytkownika
    conf2_resp = user_client.post(f"/api/v1/reports/{report2_id}/confirm-grouping", json={
        "create_new": False,
        "confirmed_problem_id": problem_id
    })
    assert conf2_resp.status_code == 200
    # Licznik unikalnych użytkowników NIE ulega podwojeniu!
    assert conf2_resp.json()["reporter_count"] == 1

def test_matchmaking_returns_innovations_and_3d_coordinates(user_client):
    # Utwórz problem
    resp = user_client.post("/api/v1/reports", json={
        "text": "Potrzeba opieki sąsiedzkiej dla samotnych seniorów.",
        "location_lat": 50.0647,
        "location_lon": 19.9450,
        "location_type": "map",
        "location_name": "Kraków"
    })
    report_id = resp.json()["report"]["id"]
    p_resp = user_client.post(f"/api/v1/reports/{report_id}/confirm-grouping", json={"create_new": True})
    problem_id = p_resp.json()["id"]

    # Pobierz dopasowane innowacje
    matches_resp = user_client.get(f"/api/v1/problems/{problem_id}/matches")
    assert matches_resp.status_code == 200
    m_data = matches_resp.json()
    assert m_data["problem_id"] == problem_id
    assert len(m_data["matches"]) > 0
    assert len(m_data["matches"]) <= 10
    match_item = m_data["matches"][0]
    assert "explanation" in match_item
    assert "limitations" in match_item
    assert "score" in match_item

    # Pobierz koordynaty 3D
    coords_resp = user_client.get(f"/api/v1/problems/{problem_id}/coordinates")
    assert coords_resp.status_code == 200
    coords = coords_resp.json()
    assert coords["problem_coords"]["entity_type"] == "problem"
    assert len(coords["solution_coords"]) > 0

def test_admin_permissions_guard(user_client):
    # Zwykły użytkownik próbuje wykonać akcję administratorską
    resp = user_client.post("/api/v1/admin/problems/merge", json={
        "target_problem_id": 1,
        "source_problem_ids": [2]
    })
    assert resp.status_code == 403
    assert "Brak uprawnień administratora" in resp.json()["detail"]

def test_admin_problem_merge_reconciles_reporters_and_votes(user_client, admin_client):
    # Utwórz problem A
    r1 = user_client.post("/api/v1/reports", json={
        "text": "Brak ławek w parku miejskim w Oświęcimiu.",
        "location_lat": 50.0344,
        "location_lon": 19.2097,
        "location_type": "map",
        "location_name": "Oświęcim"
    })
    prob_a = user_client.post(f"/api/v1/reports/{r1.json()['report']['id']}/confirm-grouping", json={"create_new": True}).json()

    # Utwórz problem B
    r2 = user_client.post("/api/v1/reports", json={
        "text": "Potrzeba miejsc do odpoczynku dla seniorów w Oświęcimiu.",
        "location_lat": 50.0344,
        "location_lon": 19.2097,
        "location_type": "map",
        "location_name": "Oświęcim"
    })
    prob_b = user_client.post(f"/api/v1/reports/{r2.json()['report']['id']}/confirm-grouping", json={"create_new": True}).json()

    # Admin scala problem B do problemu A
    merge_resp = admin_client.post("/api/v1/admin/problems/merge", json={
        "target_problem_id": prob_a["id"],
        "source_problem_ids": [prob_b["id"]]
    })
    assert merge_resp.status_code == 200
    merged_prob = merge_resp.json()
    assert merged_prob["id"] == prob_a["id"]
    # Ponieważ oba raporty złożył ten sam user (Jan Kowalski), liczba unikalnych zgłaszających wynosi 1!
    assert merged_prob["reporter_count"] == 1

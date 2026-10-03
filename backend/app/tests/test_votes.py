def test_vote_lifecycle_and_uniqueness(user_client):
    # Utwórz problem
    p_resp = user_client.post("/api/v1/reports", json={
        "text": "Potrzeba wsparcia dzieci w nauce języków obcych w Chrzanowie.",
        "location_lat": 50.1342,
        "location_lon": 19.4024,
        "location_type": "map",
        "location_name": "Chrzanów"
    })
    report_id = p_resp.json()["report"]["id"]
    prob_resp = user_client.post(f"/api/v1/reports/{report_id}/confirm-grouping", json={"create_new": True})
    problem_id = prob_resp.json()["id"]

    # 1. Pobierz karty swipe
    cards_resp = user_client.get(f"/api/v1/votes/cards?problem_id={problem_id}")
    assert cards_resp.status_code == 200
    cards = cards_resp.json()
    assert len(cards) > 0
    target_solution_id = cards[0]["solution_id"]

    # 2. Oddaj głos "support"
    vote_resp = user_client.post("/api/v1/votes", json={
        "solution_id": target_solution_id,
        "local_problem_id": problem_id,
        "vote_type": "support"
    })
    assert vote_resp.status_code == 200
    vote_data = vote_resp.json()
    assert vote_data["vote_type"] == "support"
    vote_id = vote_data["id"]

    # Sprawdź, czy liczba poparć wzrosła
    cards_after = user_client.get(f"/api/v1/votes/cards?problem_id={problem_id}").json()
    voted_card = next(c for c in cards_after if c["solution_id"] == target_solution_id)
    assert voted_card["support_count"] >= 1
    assert voted_card["my_vote"] == "support"

    # 3. Zmiana głosu na "skip" przez tego samego użytkownika (nie tworzy duplikatu w bazie)
    update_vote_resp = user_client.post("/api/v1/votes", json={
        "solution_id": target_solution_id,
        "local_problem_id": problem_id,
        "vote_type": "skip",
        "rejection_reason": "Zbyt wysokie koszty początkowe"
    })
    assert update_vote_resp.status_code == 200
    assert update_vote_resp.json()["id"] == vote_id  # ten sam rekord
    assert update_vote_resp.json()["vote_type"] == "skip"

    # 4. Cofnięcie głosu (undo)
    del_resp = user_client.delete(f"/api/v1/votes/{vote_id}")
    assert del_resp.status_code == 204

    # Po cofnięciu my_vote jest None
    cards_final = user_client.get(f"/api/v1/votes/cards?problem_id={problem_id}").json()
    voted_card_final = next(c for c in cards_final if c["solution_id"] == target_solution_id)
    assert voted_card_final["my_vote"] is None

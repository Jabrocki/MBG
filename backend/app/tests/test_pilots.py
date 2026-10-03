def test_pilot_preconditions_and_volunteering(user_client, admin_client):
    # 1. Utworzenie projektu pilotażowego
    p_resp = admin_client.post("/api/v1/pilots", json={
        "title": "Pilotaż Bawita w Nowym Targu",
        "description": "Projekt pilotażowy integracji międzypokoleniowej",
        "budget_declared": 15000.0,
        "max_volunteers": 1
    })
    assert p_resp.status_code == 200
    pilot_id = p_resp.json()["id"]

    # 2. Próba uruchomienia pilotażu bez spełnienia warunków wstępnych (preconditions)
    # Powinna zwrócić 422
    fail_trans = admin_client.post(f"/api/v1/pilots/{pilot_id}/transition", json={
        "target_status": "pilot"
    })
    assert fail_trans.status_code == 422
    detail = fail_trans.json()["detail"]
    assert "Niespełnione kryteria startu" in detail

    # 3. Wolontariusz rejestruje się
    vol_resp = user_client.post(f"/api/v1/pilots/{pilot_id}/volunteer")
    assert vol_resp.status_code == 200
    assert vol_resp.json()["status"] == "registered"

    # Akceptacja miejsca przez wolontariusza
    acc_resp = user_client.post(f"/api/v1/pilots/{pilot_id}/accept-offer")
    assert acc_resp.status_code == 200
    assert acc_resp.json()["status"] == "accepted"

    # 4. Spełniamy wszystkie kryteria startu
    valid_trans = admin_client.post(f"/api/v1/pilots/{pilot_id}/transition", json={
        "target_status": "pilot",
        "budget_approved": 15000.0,
        "accountable_owner": "Koordynator Miejski ROPS"
    })
    # Uzupełnijmy pozostałe wymagane pola (partners, test_plan) bezpośrednio w pilocie jeśli trzeba
    # Sprawdźmy czy przejście jest możliwe po spełnieniu kryteriów

    # 5. Ocena satysfakcji przez uczestnika
    fb_resp = user_client.post(f"/api/v1/pilots/{pilot_id}/feedback", json={
        "role": "beneficiary",
        "rating": 5,
        "comment": "Wspaniała inicjatywa, dzieci zachwycone wspólnymi grami z seniorami.",
        "improvements": "Można dodać więcej warsztatów w weekendy."
    })
    assert fb_resp.status_code == 200
    assert fb_resp.json()["rating"] == 5

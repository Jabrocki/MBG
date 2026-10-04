def test_idea_lifecycle_and_publication_gates(user_client, admin_client):
    # 1. Tworzenie wersji roboczej (draft)
    draft_resp = user_client.post("/api/v1/ideas", json={
        "text_raw": "Stworzenie międzypokoleniowego ogrodu społecznego na osiedlu w Skawinie.",
        "canonical_problem_id": 1,
        "need": "Brak integracji mieszkańców i zielonej przestrzeni spotkań.",
    })
    assert draft_resp.status_code == 200
    idea = draft_resp.json()
    assert idea["status"] == "private_draft"
    idea_id = idea["id"]

    # 2. Pomysł nie jest jeszcze widoczny w publicznych
    pub_resp = user_client.get("/api/v1/ideas/public")
    assert not any(i["id"] == idea_id for i in pub_resp.json())

    # 3. Zgłoszenie do kolejki AI
    submit_resp = user_client.post(f"/api/v1/ideas/{idea_id}/submit")
    assert submit_resp.status_code == 200
    job_status = submit_resp.json()
    assert job_status["status"] == "done"

    # 4. Potwierdzenie przez autora
    confirm_resp = user_client.post(f"/api/v1/ideas/{idea_id}/author-confirm", json={
        "text_refined": "Zorganizowany Ogród Społeczny w Skawinie",
        "need": "Potrzeba integracji",
        "beneficiaries": "Mieszkańcy Skawiny",
        "solution": "Wspólny ogród warzywno-kwiatowy",
        "partners": "Urząd Miasta Skawina",
        "costs": "8000 PLN",
        "resources": "Działka miejska, narzędzia",
        "stages": "1. Przygotowanie terenu, 2. Sadzenie, 3. Warsztaty"
    })
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["status"] == "pending_admin"

    # Pomysł wciąż nie jest publiczny przed zatwierdzeniem admina!
    pub_resp = user_client.get("/api/v1/ideas/public")
    assert not any(i["id"] == idea_id for i in pub_resp.json())

    # Zwykły użytkownik nie może zatwierdzić publikacji
    unauth_resp = user_client.post(f"/api/v1/ideas/{idea_id}/admin-approve")
    assert unauth_resp.status_code == 403

    # 5. Zatwierdzenie przez administratora
    admin_approve_resp = admin_client.post(f"/api/v1/ideas/{idea_id}/admin-approve")
    assert admin_approve_resp.status_code == 200
    assert admin_approve_resp.json()["status"] == "public"

    # Approval turns the user idea into an indexable solution; drafts never enter the catalogue.
    from src.models.source import Solution
    from conftest import TestingSessionLocal
    with TestingSessionLocal() as db:
        assert db.query(Solution).filter(Solution.source_knowledge.has(source_url=f"user-idea://{idea_id}")).count() == 1

    # Teraz pomysł jest w publicznej liście
    pub_resp = user_client.get("/api/v1/ideas/public")
    assert any(i["id"] == idea_id for i in pub_resp.json())

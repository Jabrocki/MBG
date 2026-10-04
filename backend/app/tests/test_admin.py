def test_admin_permissions_guard(user_client):
    # Zwykły użytkownik próbuje wykonać akcję administratorską
    resp = user_client.post("/api/v1/admin/problems/merge", json={
        "target_problem_id": 1,
        "source_problem_ids": [2]
    })
    assert resp.status_code == 403
    assert "Brak uprawnień administratora" in resp.json()["detail"]


def test_admin_dashboard_counts_are_database_backed(user_client, admin_client):
    empty = admin_client.get("/api/v1/admin/dashboard")
    assert empty.status_code == 200
    assert empty.json() == {
        "reports_total": 0,
        "reports_waiting_grouping": 0,
        "ideas_total": 0,
        "ideas_waiting_admin": 0,
        "pilots_total": 0,
        "pilots_waiting_start": 0,
    }

    report = user_client.post(
        "/api/v1/reports",
        json={
            "text": "Potrzebujemy bezpiecznego miejsca spotkań dla seniorów w Wieliczce.",
            "location_lat": 49.9871,
            "location_lon": 20.0647,
            "location_type": "map",
            "location_name": "Wieliczka",
        },
    )
    assert report.status_code == 200
    idea = user_client.post("/api/v1/ideas", json={"text_raw": "Sąsiedzkie spotkania ze wsparciem wolontariuszy.", "canonical_problem_id": 1})
    assert idea.status_code == 200
    counts = admin_client.get("/api/v1/admin/dashboard")
    assert counts.status_code == 200
    assert counts.json()["reports_total"] == 1
    assert counts.json()["reports_waiting_grouping"] == 1
    assert counts.json()["ideas_total"] == 1
    assert counts.json()["ideas_waiting_admin"] == 0

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


def test_admin_operational_reads_and_catalogue_crud(user_client, admin_client):
    report = user_client.post(
        "/api/v1/reports",
        json={
            "text": "Potrzebujemy dostępnych zajęć wspierających seniorów w Wieliczce.",
            "location_lat": 49.9871,
            "location_lon": 20.0647,
            "location_type": "map",
            "location_name": "Wieliczka",
        },
    )
    assert report.status_code == 200
    report_id = report.json()["report"]["id"]

    status = admin_client.patch(f"/api/v1/admin/reports/{report_id}/status", json={"status": "rejected"})
    assert status.status_code == 200
    assert status.json()["status"] == "rejected"

    problem = user_client.post(
        f"/api/v1/reports/{report_id}/confirm-grouping",
        json={"create_new": True},
    )
    assert problem.status_code == 200
    problems = admin_client.get("/api/v1/admin/problems")
    assert problems.status_code == 200
    assert any(item["id"] == problem.json()["id"] for item in problems.json())

    created = admin_client.post(
        "/api/v1/admin/catalogue",
        json={
            "title": "Warsztat dostępnej komunikacji",
            "description": "Program lokalnych ćwiczeń z dostępnej komunikacji.",
            "category": "Dostępność",
            "source_url": "https://example.test/warsztat-dostepnosci",
            "target_audience": "Mieszkańcy",
            "cost_estimate": "Niski",
            "limitations": "Wymaga lokalnego prowadzącego.",
        },
    )
    assert created.status_code == 200
    solution_id = created.json()["id"]

    edited = admin_client.patch(
        f"/api/v1/admin/catalogue/{solution_id}",
        json={"title": "Warsztat komunikacji dostępnej", "category": "Edukacja"},
    )
    assert edited.status_code == 200
    assert edited.json()["title"] == "Warsztat komunikacji dostępnej"
    assert edited.json()["category"] == "Edukacja"

    deleted = admin_client.delete(f"/api/v1/admin/catalogue/{solution_id}")
    assert deleted.status_code == 204
    assert admin_client.get(f"/api/v1/catalogue/{solution_id}").status_code == 404


def test_admin_can_read_idea_and_volunteer_queues(user_client, admin_client):
    idea = user_client.post(
        "/api/v1/ideas",
        json={"text_raw": "Propozycja sąsiedzkiego wsparcia dla osób potrzebujących codziennej pomocy.", "canonical_problem_id": 1},
    )
    assert idea.status_code == 200
    ideas = admin_client.get("/api/v1/ideas/admin/list")
    assert ideas.status_code == 200
    assert any(item["id"] == idea.json()["id"] for item in ideas.json())

    pilot = admin_client.post(
        "/api/v1/pilots",
        json={
            "title": "Pilotaż wolontariatu lokalnego",
            "description": "Weryfikacja kolejki wolontariuszy.",
            "max_volunteers": 1,
        },
    )
    assert pilot.status_code == 200
    pilot_id = pilot.json()["id"]
    assert user_client.post(f"/api/v1/pilots/{pilot_id}/volunteer").status_code == 200

    volunteers = admin_client.get(f"/api/v1/admin/pilots/{pilot_id}/volunteers")
    assert volunteers.status_code == 200
    assert len(volunteers.json()) == 1
    assert volunteers.json()[0]["status"] == "registered"

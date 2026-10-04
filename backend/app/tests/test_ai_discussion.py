import pytest

from src.adapters.ai_gateway import get_ai_gateway
from src.models.problem import CanonicalProblem


def _thread(user_client, db_session):
    if db_session.get(CanonicalProblem, 1) is None:
        db_session.add(CanonicalProblem(
            id=1, title='Spotkania sąsiedzkie', generated_description='Brakuje spotkań sąsiadów.',
            reporter_count=1, location_centroid_lat=50.06, location_centroid_lon=19.94,
            status='active',
        ))
        db_session.commit()
    response = user_client.post('/api/v1/ideas', json={
        'text_raw': 'Spotkania sąsiedzkie przy grach planszowych w bezpłatnej sali.',
        'canonical_problem_id': 1,
    })
    assert response.status_code == 200, response.text
    idea = response.json()
    return idea['id'], user_client.get(f"/api/v1/ideas/{idea['id']}/thread").json()


def test_ai_discussion_retains_question_reply_and_context(user_client, db_session, monkeypatch):
    idea_id, thread = _thread(user_client, db_session)
    contexts = []

    def reply(idea, context, question):
        contexts.append(context)
        return f'Odpowiedź: {question}'

    monkeypatch.setattr(get_ai_gateway(), 'discuss_idea', reply)
    question = 'Mamy tylko salę i wolontariuszy. Jak zacząć?'
    response = user_client.post(f"/api/v1/threads/{thread['id']}/ai", json={'content': question})
    assert response.status_code == 200
    assert response.json()['is_ai'] is True
    saved = user_client.get(f'/api/v1/ideas/{idea_id}/thread').json()['messages']
    assert [(m['is_ai'], m['content']) for m in saved[-2:]] == [
        (False, question), (True, f'Odpowiedź: {question}'),
    ]
    response = user_client.post(f"/api/v1/threads/{thread['id']}/ai", json={'content': 'A co podczas deszczu?'})
    assert response.status_code == 200
    assert question in contexts[-1]
    assert f'Odpowiedź: {question}' in contexts[-1]


def test_failed_ai_discussion_does_not_persist_half_an_exchange(user_client, db_session, monkeypatch):
    idea_id, thread = _thread(user_client, db_session)

    def fail(*args):
        raise RuntimeError('AI unavailable')

    monkeypatch.setattr(get_ai_gateway(), 'discuss_idea', fail)
    with pytest.raises(RuntimeError, match='AI unavailable'):
        user_client.post(f"/api/v1/threads/{thread['id']}/ai", json={'content': 'Jak zacząć spotkania?'})
    saved = user_client.get(f'/api/v1/ideas/{idea_id}/thread').json()['messages']
    assert saved == thread['messages']

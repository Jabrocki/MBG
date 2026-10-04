import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, clearSession, saveSession, type Session } from './api'

const session: Session = {
  access_token: 'demo-token',
  token_type: 'bearer',
  role: 'user',
  user_id: 1,
  user_name: 'Jan Kowalski',
}

describe('client API MBG', () => {
  afterEach(() => {
    clearSession()
    vi.unstubAllGlobals()
  })

  it('sends the stored session and creates a report through the public contract', async () => {
    saveSession(session)
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ report: { id: 42 }, suggested_candidates: [] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await api.createReport({
      text: 'Brakuje regularnych spotkań sąsiedzkich dla seniorów w Wieliczce.',
      location_lat: 49.9871,
      location_lon: 20.0647,
      location_name: 'Wieliczka',
      location_type: 'map',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/reports',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer demo-token' }),
      }),
    )
  })

  it('turns an API validation response into a useful error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Lokalizacja poza Małopolską.' }), { status: 422 }),
    ))

    await expect(api.loginDemo('user')).rejects.toMatchObject({
      status: 422,
      message: 'Lokalizacja poza Małopolską.',
    })
  })

  it('sends registration and password login through the authentication contract', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(session), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(session), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.register({
      name: 'Alicja',
      surname: 'Testowa',
      email: 'alicja@example.test',
      password: 'Bezpieczne2026',
      is_anonymous_by_default: true,
    })
    await api.login('alicja@example.test', 'Bezpieczne2026')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/auth/register',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/auth/login',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('uses the persisted API contracts for ideas and reversible support votes', async () => {
    saveSession(session)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 7, status: 'pending_author' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 7, status: 'pending_admin' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 22, vote_type: 'support' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.getPublicIdeas()
    await api.listMyIdeas()
    await api.getIdea(7)
    await api.authorConfirmIdea(7, {
      text_refined: 'Uporządkowany opis pomysłu.',
      need: 'Potrzeba',
      beneficiaries: 'Odbiorcy',
      solution: 'Rozwiązanie',
      partners: 'Partnerzy',
      costs: 'Koszty',
      resources: 'Zasoby',
      stages: 'Etapy',
    })
    await api.getSupportCards(3)
    await api.castVote({ solution_id: 9, local_problem_id: 3, vote_type: 'support' })
    await api.undoVote(22)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/ideas/public',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer demo-token' }) }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/ideas/mine', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/v1/ideas/7', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/api/v1/ideas/7/author-confirm',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(5, '/api/v1/votes/cards?problem_id=3', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(6, '/api/v1/votes', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenNthCalledWith(7, '/api/v1/votes/22', expect.objectContaining({ method: 'DELETE' }))
  })

  it('loads an idea discussion and posts a message through the persisted thread contract', async () => {
    saveSession(session)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 13, idea_id: 7, title: 'Dyskusja: pomysł', messages: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 31, thread_id: 13, author_id: 1, author_name: 'Jan Kowalski', content: 'Moja wiadomość', created_at: '2026-10-04T10:00:00Z' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.getIdeaThread(7)
    await api.postThreadMessage(13, 'Moja wiadomość')

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/ideas/7/thread',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer demo-token' }) }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/threads/13/messages',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ content: 'Moja wiadomość' }) }),
    )
  })

  it('preserves a failed AI job status so the saved idea is not treated as published', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          job_id: 18,
          entity_type: 'idea',
          entity_id: 7,
          job_type: 'refine_idea',
          status: 'failed',
          attempt_count: 1,
          last_error: 'Usługa AI jest niedostępna.',
          created_at: '2026-10-04T10:00:00Z',
          processed_at: null,
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const job = await api.submitIdea(7)

    expect(job).toMatchObject({ status: 'failed', entity_id: 7, last_error: 'Usługa AI jest niedostępna.' })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/ideas/7/submit', expect.objectContaining({ method: 'POST' }))
  })

  it('loads pilots with the current session and sends volunteer lifecycle actions to the API', async () => {
    saveSession(session)
    const volunteer = {
      id: 7,
      pilot_id: 13,
      user_id: 1,
      user_name: 'Jan Kowalski',
      status: 'registered',
      skills_confirmed: false,
      position: 0,
      offered_at: null,
      accepted_at: null,
      created_at: '2026-10-04T10:00:00',
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(volunteer), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...volunteer, status: 'accepted' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.listPilots()
    await api.registerPilotVolunteer(13)
    await api.acceptPilotOffer(13)
    await api.cancelPilotVolunteer(13)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/pilots',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer demo-token' }) }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/pilots/13/volunteer',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/v1/pilots/13/accept-offer',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/api/v1/pilots/13/volunteer',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('submits pilot feedback as structured data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 3, pilot_id: 13, rating: 5 }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await api.submitPilotFeedback(13, {
      role: 'volunteer',
      rating: 5,
      comment: 'Dobrze przygotowane działania.',
      improvements: 'Przyda się więcej terminów.',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/pilots/13/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          role: 'volunteer',
          rating: 5,
          comment: 'Dobrze przygotowane działania.',
          improvements: 'Przyda się więcej terminów.',
        }),
      }),
    )
  })

  it('uses persisted administration contracts for queues, catalogue and pilot operations', async () => {
    saveSession(session)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 4, status: 'confirmed' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 8, title: 'Innowacja' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 12, status: 'draft' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 12, status: 'review' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 5, status: 'offered' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.listAdminProblems()
    await api.updateAdminReportStatus(4, 'confirmed')
    await api.createAdminCatalogueItem({
      title: 'Innowacja',
      description: 'Opis rozwiązania społecznego.',
      category: 'Dostępność',
      source_url: 'https://example.test/source',
    })
    await api.deleteAdminCatalogueItem(8)
    await api.listAdminIdeas()
    await api.createPilot({ title: 'Pilotaż', description: 'Opis pilotażu', budget_declared: 1000, max_volunteers: 2 })
    await api.transitionPilot(12, { target_status: 'review', accountable_owner: 'Koordynator' })
    await api.listPilotVolunteers(12)
    await api.promotePilotVolunteer(12, 5)

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/admin/problems', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/admin/reports/4/status',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'confirmed' }) }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/v1/admin/catalogue',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/v1/admin/catalogue/8', expect.objectContaining({ method: 'DELETE' }))
    expect(fetchMock).toHaveBeenNthCalledWith(5, '/api/v1/ideas/admin/list', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(6, '/api/v1/pilots', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenNthCalledWith(7, '/api/v1/pilots/12/transition', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenNthCalledWith(8, '/api/v1/admin/pilots/12/volunteers', expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(
      9,
      '/api/v1/admin/pilots/12/promote-volunteer?user_id=5',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

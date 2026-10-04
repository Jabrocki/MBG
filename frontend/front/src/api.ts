const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const TOKEN_KEY = 'mbg-access-token'

export type Session = {
  access_token: string
  token_type: 'bearer'
  role: 'user' | 'admin'
  user_id: number
  user_name: string
}

export type Registration = {
  name: string
  surname: string
  email: string
  password: string
  is_anonymous_by_default: boolean
}

export type Report = {
  id: number
  text_raw: string
  location_lat: number
  location_lon: number
  location_name: string
  categories: string[]
  audience: string
  urgency: string
  duration: string
  is_urgent: boolean
  status: string
  canonical_problem_id: number | null
  urgent_guidance: string | null
}

export type ProblemCandidate = { problem_id: number; title: string; confidence: number }
export type ReportSubmission = { report: Report; suggested_candidates: ProblemCandidate[] }
export type CanonicalProblem = {
  id: number
  title: string
  generated_description: string
  reporter_count: number
  location_centroid_lat: number
  location_centroid_lon: number
  status: string
}
export type Innovation = {
  id: number
  title: string
  description: string
  target_audience: string
  cost_estimate: string
  limitations: string
  category: string
  source_url: string | null
  support_count?: number
  skip_count?: number
  vote_score?: number
}
export type InnovationMatch = Innovation & {
  solution_id: number
  rank: number
  score: number
  explanation: string
  coord_x: number
  coord_y: number
  coord_z: number
}
export type MatchList = { problem_id: number; total_matches: number; matches: InnovationMatch[] }
export type Coordinates = {
  problem_id: number
  problem_coords: { id: number; title: string; x: number; y: number; z: number }
  solution_coords: { id: number; title: string; x: number; y: number; z: number }[]
}
export type Idea = {
  id: number
  canonical_problem_id: number
  text_raw: string
  text_refined: string | null
  need: string | null
  beneficiaries: string | null
  solution: string | null
  partners: string | null
  costs: string | null
  resources: string | null
  stages: string | null
  status: string
  support_count: number
  skip_count: number
  created_at: string
  author_name: string | null
}
export type AIJobStatus = {
  job_id: number
  entity_type: string
  entity_id: number
  job_type: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  attempt_count: number
  last_error: string | null
  created_at: string
  processed_at: string | null
}
export type IdeaAuthorConfirmation = {
  text_refined: string
  need: string
  beneficiaries: string
  solution: string
  partners: string
  costs: string
  resources: string
  stages: string
}
export type SupportCard = {
  solution_id: number
  idea_id?: number | null
  problem_id: number
  problem_title: string
  title: string
  description: string
  badge: 'proposed_idea' | 'being_tested' | 'established_innovation'
  support_count: number
  skip_count: number
  my_vote: 'support' | 'skip' | null
  my_vote_id?: number | null
}
export type Vote = {
  id: number
  user_id: number
  solution_id: number
  local_problem_id: number
  vote_type: 'support' | 'skip'
  rejection_reason: string | null
  created_at: string
}

export type AdminDashboardCounts = {
  reports_total: number
  reports_waiting_grouping: number
  ideas_total: number
  ideas_waiting_admin: number
  pilots_total: number
  pilots_waiting_start: number
}

export type PublicStats = {
  innovations: number
  problems: number
  reports: number
  ideas: number
  pilots: number
}

export type AdminCatalogueInput = {
  title: string
  description: string
  category: string
  source_url: string
  target_audience?: string
  cost_estimate?: string
  limitations?: string
}

export type PilotTransitionInput = {
  target_status: Exclude<PilotStatus, 'draft'>
  budget_approved?: number | null
  accountable_owner?: string | null
  partners?: string | null
  test_plan?: string | null
}

export type PilotCreateInput = {
  solution_id?: number | null
  idea_id?: number | null
  title: string
  description: string
  budget_declared: number
  partners?: string
  test_plan?: string
  max_volunteers: number
}

export type GeographicMarker = {
  id: string
  entity_type: 'report' | 'problem' | 'innovation' | 'pilot'
  entity_id: number
  title: string
  lat: number
  lon: number
  location_name: string
  precision: 'exact' | 'area' | 'aggregate' | 'municipality'
  visibility: 'private' | 'admin' | 'authenticated'
  distance_km: number | null
  reporter_count: number | null
  status: string | null
  category: string | null
  source_url: string | null
}

export type GeographicMap = {
  center: { lat: number; lon: number } | null
  radius_km: number | null
  markers: GeographicMarker[]
  counts: {
    reports: number
    problems: number
    innovations: number
    pilots?: number
    innovations_without_known_location: number
  }
  privacy_note: string
}
export type LocalitySearchResult = {
  name: string
  latitude: number
  longitude: number
  display_name: string
}

export type PilotStatus =
  | 'draft'
  | 'review'
  | 'recruitment_funding'
  | 'pilot'
  | 'evaluation'
  | 'dissemination'
  | 'unavailable'

export type VolunteerStatus = 'registered' | 'waiting' | 'offered' | 'accepted' | 'cancelled'

export type Pilot = {
  id: number
  solution_id: number | null
  idea_id: number | null
  title: string
  description: string
  status: PilotStatus
  budget_declared: number
  budget_approved: number | null
  accountable_owner: string | null
  partners: string | null
  test_plan: string | null
  max_volunteers: number
  registered_volunteers_count: number
  waiting_list_count: number
  my_volunteer_status: VolunteerStatus | null
  my_volunteer_position: number | null
  created_at: string
}

export type Volunteer = {
  id: number
  pilot_id: number
  user_id: number
  user_name: string | null
  status: VolunteerStatus
  skills_confirmed: boolean
  position: number
  offered_at: string | null
  accepted_at: string | null
  created_at: string
}

export type PilotFeedback = {
  id: number
  pilot_id: number
  user_id: number
  role: 'beneficiary' | 'volunteer'
  rating: number
  comment: string | null
  improvements: string | null
  created_at: string
}

export type DiscussionMessage = {
  id: number
  thread_id: number
  author_id: number
  author_name: string
  is_ai: boolean
  content: string
  created_at: string
}

export type DiscussionThread = {
  id: number
  idea_id: number
  title: string
  created_at: string
  messages: DiscussionMessage[]
  recommended_innovations: { solution_id: number; title: string; description: string; similarity: number }[]
}

export type Notification = {
  id: number
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export type InstitutionAdaptation = {
  id: number
  user_id: number
  solution_id: number
  beneficiaries: string
  location: string
  resources: string
  budget: string
  constraints: string
  draft_adaptation: string | null
  solution_title: string | null
  source_url: string | null
  created_at: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem('mbg-session')
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session) {
  sessionStorage.setItem('mbg-session', JSON.stringify(session))
  sessionStorage.setItem(TOKEN_KEY, session.access_token)
}

export function clearSession() {
  sessionStorage.removeItem('mbg-session')
  sessionStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (response.status === 204) return undefined as T
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const detail =
      typeof payload === 'object' && payload && 'detail' in payload && typeof payload.detail === 'string'
        ? payload.detail
        : 'Nie udało się połączyć z usługą MBG.'
    throw new ApiError(response.status, detail)
  }
  return payload as T
}

export const api = {
  loginDemo(role: 'user' | 'admin') {
    return request<Session>('/auth/demo', { method: 'POST', body: JSON.stringify({ role }) })
  },
  login(email: string, password: string) {
    return request<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  register(data: Registration) {
    return request<Session>('/auth/register', { method: 'POST', body: JSON.stringify(data) })
  },
  requestPasswordReset(email: string) {
    return request<{ message: string }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) })
  },
  confirmPasswordReset(token: string, newPassword: string) {
    return request<{ message: string }>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, new_password: newPassword }) })
  },
  changePassword(currentPassword: string, newPassword: string) {
    return request<{ message: string }>('/auth/password-change', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) })
  },
  logout() {
    return request<void>('/auth/logout', { method: 'POST' })
  },
  getAdminDashboard() {
    return request<AdminDashboardCounts>('/admin/dashboard')
  },
  getPublicStats() {
    return request<PublicStats>('/public/stats')
  },
  listAdminProblems() {
    return request<CanonicalProblem[]>('/admin/problems')
  },
  updateAdminReportStatus(id: number, status: 'submitted' | 'confirmed' | 'rejected') {
    return request<Report>(`/admin/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
  mergeProblems(targetProblemId: number, sourceProblemIds: number[]) {
    return request<CanonicalProblem>('/admin/problems/merge', {
      method: 'POST',
      body: JSON.stringify({ target_problem_id: targetProblemId, source_problem_ids: sourceProblemIds }),
    })
  },
  splitProblem(problemId: number, reportIdsToDetach: number[], newProblemTitle: string) {
    return request<CanonicalProblem>('/admin/problems/split', {
      method: 'POST',
      body: JSON.stringify({
        problem_id: problemId,
        report_ids_to_detach: reportIdsToDetach,
        new_problem_title: newProblemTitle,
      }),
    })
  },
  mergeSolutions(targetSolutionId: number, duplicateSolutionIds: number[]) {
    return request<void>('/admin/solutions/merge', {
      method: 'POST',
      body: JSON.stringify({ target_solution_id: targetSolutionId, duplicate_solution_ids: duplicateSolutionIds }),
    })
  },
  createAdminCatalogueItem(data: AdminCatalogueInput) {
    return request<Innovation>('/admin/catalogue', { method: 'POST', body: JSON.stringify(data) })
  },
  updateAdminCatalogueItem(id: number, data: Partial<AdminCatalogueInput>) {
    return request<Innovation>(`/admin/catalogue/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  deleteAdminCatalogueItem(id: number) {
    return request<void>(`/admin/catalogue/${id}`, { method: 'DELETE' })
  },
  getReport(id: number) {
    return request<Report>(`/reports/${id}`)
  },
  listMyReports() {
    return request<{ reports: Report[] }>('/reports').then(({ reports }) => reports)
  },
  createReport(data: {
    text: string
    location_lat: number
    location_lon: number
    location_name: string
    location_type: 'map' | 'manual' | 'gps'
  }) {
    return request<ReportSubmission>('/reports', { method: 'POST', body: JSON.stringify(data) })
  },
  updateReportCategories(id: number, categories: string[]) {
    return request<Report>(`/reports/${id}/categories`, {
      method: 'PATCH',
      body: JSON.stringify({ categories }),
    })
  },
  updateReportDetails(id: number, data: { audience: string; urgency: 'standard' | 'urgent' }) {
    return request<Report>(`/reports/${id}/details`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  confirmGrouping(id: number, confirmedProblemId: number | null, createNew: boolean) {
    return request<CanonicalProblem>(`/reports/${id}/confirm-grouping`, {
      method: 'POST',
      body: JSON.stringify({ confirmed_problem_id: confirmedProblemId, create_new: createNew }),
    })
  },
  getMatches(problemId: number) {
    return request<MatchList>(`/problems/${problemId}/matches`)
  },
  getAiProposal(problemId: number) {
    return request<{ proposal: string; based_on: string[] }>(`/problems/${problemId}/ai-proposal`)
  },
  refineAiProposal(problemId: number, message: string, proposal: string) {
    return request<{ proposal: string; based_on: string[] }>(`/problems/${problemId}/ai-proposal`, {
      method: 'POST',
      body: JSON.stringify({ message, proposal }),
    })
  },
  getProblem(problemId: number) {
    return request<CanonicalProblem>(`/problems/${problemId}`)
  },
  getCoordinates(problemId: number) {
    return request<Coordinates>(`/problems/${problemId}/coordinates`)
  },
  getMapMarkers(lat?: number, lon?: number, radiusKm?: number) {
    const params = new URLSearchParams()
    if (lat !== undefined && lon !== undefined) {
      params.set('lat', String(lat))
      params.set('lon', String(lon))
    }
    if (radiusKm !== undefined) params.set('radius_km', String(radiusKm))
    return request<GeographicMap>(`/map/markers${params.size ? `?${params}` : ''}`)
  },
  searchLocalities(query: string) {
    return request<LocalitySearchResult[]>(`/map/localities?query=${encodeURIComponent(query)}`)
  },
  searchCatalogue(query = '', category = '') {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category && category !== 'Wszystkie') params.set('category', category)
    return request<Innovation[]>(`/catalogue${params.size ? `?${params}` : ''}`)
  },
  getCatalogueItem(solutionId: number) {
    return request<Innovation>(`/catalogue/${solutionId}`)
  },
  createIdea(data: {
    text_raw: string
    canonical_problem_id: number
    need?: string
    beneficiaries?: string
    solution?: string
    partners?: string
    costs?: string
    resources?: string
    stages?: string
  }) {
    return request<Idea>('/ideas', { method: 'POST', body: JSON.stringify(data) })
  },
  submitIdea(id: number) {
    return request<AIJobStatus>(`/ideas/${id}/submit`, { method: 'POST' })
  },
  listMyIdeas() {
    return request<Idea[]>('/ideas/mine')
  },
  getIdea(id: number) {
    return request<Idea>(`/ideas/${id}`)
  },
  getPublicIdeas() {
    return request<Idea[]>('/ideas/public')
  },
  listAdminIdeas() {
    return request<Idea[]>('/ideas/admin/list')
  },
  approveIdea(id: number) {
    return request<Idea>(`/ideas/${id}/admin-approve`, { method: 'POST' })
  },
  authorConfirmIdea(id: number, data: IdeaAuthorConfirmation) {
    return request<Idea>(`/ideas/${id}/author-confirm`, { method: 'POST', body: JSON.stringify(data) })
  },
  getSupportCards(problemId: number) {
    return request<SupportCard[]>(`/votes/cards?problem_id=${encodeURIComponent(problemId)}`)
  },
  castVote(data: {
    solution_id: number
    local_problem_id: number
    vote_type: 'support' | 'skip'
    rejection_reason?: string
  }) {
    return request<Vote>('/votes', { method: 'POST', body: JSON.stringify(data) })
  },
  undoVote(voteId: number) {
    return request<void>(`/votes/${voteId}`, { method: 'DELETE' })
  },
  listPilots() {
    return request<Pilot[]>('/pilots')
  },
  createPilot(data: PilotCreateInput) {
    return request<Pilot>('/pilots', { method: 'POST', body: JSON.stringify(data) })
  },
  getPilot(id: number) {
    return request<Pilot>(`/pilots/${id}`)
  },
  transitionPilot(id: number, data: PilotTransitionInput) {
    return request<Pilot>(`/pilots/${id}/transition`, { method: 'POST', body: JSON.stringify(data) })
  },
  listPilotVolunteers(id: number) {
    return request<Volunteer[]>(`/admin/pilots/${id}/volunteers`)
  },
  promotePilotVolunteer(id: number, userId: number) {
    return request<Volunteer>(`/admin/pilots/${id}/promote-volunteer?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
    })
  },
  getMyPilotVolunteer(id: number) {
    return request<Volunteer>(`/pilots/${id}/volunteer`)
  },
  registerPilotVolunteer(id: number) {
    return request<Volunteer>(`/pilots/${id}/volunteer`, { method: 'POST' })
  },
  cancelPilotVolunteer(id: number) {
    return request<void>(`/pilots/${id}/volunteer`, { method: 'DELETE' })
  },
  acceptPilotOffer(id: number) {
    return request<Volunteer>(`/pilots/${id}/accept-offer`, { method: 'POST' })
  },
  submitPilotFeedback(
    id: number,
    data: { role: 'beneficiary' | 'volunteer'; rating: number; comment?: string; improvements?: string },
  ) {
    return request<PilotFeedback>(`/pilots/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  getIdeaThread(id: number) {
    return request<DiscussionThread>(`/ideas/${id}/thread`)
  },
  postThreadMessage(threadId: number, content: string) {
    return request<DiscussionMessage>(`/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  },
  postAIThreadMessage(threadId: number, content: string) {
    return request<DiscussionMessage>(`/threads/${threadId}/ai`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  },
  listNotifications() {
    return request<Notification[]>('/notifications')
  },
  markNotificationRead(id: number) {
    return request<void>(`/notifications/${id}/read`, { method: 'POST' })
  },
  createAdaptation(data: {
    solution_id: number
    beneficiaries: string
    location: string
    resources: string
    budget: string
    constraints: string
  }) {
    return request<InstitutionAdaptation>('/adaptations', { method: 'POST', body: JSON.stringify(data) })
  },
  listMyAdaptations() {
    return request<InstitutionAdaptation[]>('/adaptations/mine')
  },
  getAdaptation(id: number) {
    return request<InstitutionAdaptation>(`/adaptations/${id}`)
  },
}

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# Idea schemas
class IdeaCreateRequest(BaseModel):
    text_raw: str = Field(..., min_length=10)
    canonical_problem_id: int = Field(..., ge=1)
    need: Optional[str] = None
    beneficiaries: Optional[str] = None
    solution: Optional[str] = None
    partners: Optional[str] = None
    costs: Optional[str] = None
    resources: Optional[str] = None
    stages: Optional[str] = None

class IdeaResponse(BaseModel):
    id: int
    author_id: int
    canonical_problem_id: int
    text_raw: str
    text_refined: Optional[str] = None
    need: Optional[str] = None
    beneficiaries: Optional[str] = None
    solution: Optional[str] = None
    partners: Optional[str] = None
    costs: Optional[str] = None
    resources: Optional[str] = None
    stages: Optional[str] = None
    status: str
    created_at: datetime
    author_name: Optional[str] = None

class IdeaAuthorConfirmRequest(BaseModel):
    text_refined: str
    need: str
    beneficiaries: str
    solution: str
    partners: str
    costs: str
    resources: str
    stages: str

class AIJobStatusResponse(BaseModel):
    job_id: int
    entity_type: str
    entity_id: int
    job_type: str
    status: str
    attempt_count: int
    last_error: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

# Vote schemas
class VoteCreateRequest(BaseModel):
    solution_id: int
    local_problem_id: int
    vote_type: str = Field(..., pattern="^(support|skip)$")
    rejection_reason: Optional[str] = None

class VoteResponse(BaseModel):
    id: int
    user_id: int
    solution_id: int
    local_problem_id: int
    vote_type: str
    rejection_reason: Optional[str] = None
    created_at: datetime

class SwipeCardResponse(BaseModel):
    solution_id: int
    problem_id: int
    title: str
    description: str
    badge: str  # "proposed_idea" | "being_tested" | "established_innovation"
    support_count: int
    skip_count: int
    my_vote: Optional[str] = None
    # The persisted vote ID is needed for an undo action after a page refresh.
    # It is only ever the current authenticated user's own vote.
    my_vote_id: Optional[int] = None

# Pilot schemas
class PilotCreateRequest(BaseModel):
    solution_id: Optional[int] = None
    idea_id: Optional[int] = None
    title: str
    description: str = ""
    budget_declared: float = 0.0
    partners: Optional[str] = None
    test_plan: Optional[str] = None
    max_volunteers: int = 10

class PilotTransitionRequest(BaseModel):
    target_status: str = Field(..., pattern="^(review|recruitment_funding|pilot|evaluation|dissemination|unavailable)$")
    budget_approved: Optional[float] = None
    accountable_owner: Optional[str] = None
    partners: Optional[str] = None
    test_plan: Optional[str] = None

class PromoteVolunteerRequest(BaseModel):
    user_id: int

class PilotResponse(BaseModel):
    id: int
    solution_id: Optional[int] = None
    idea_id: Optional[int] = None
    canonical_problem_id: Optional[int] = None
    title: str
    description: str
    status: str
    budget_declared: float
    budget_approved: Optional[float] = None
    accountable_owner: Optional[str] = None
    partners: Optional[str] = None
    test_plan: Optional[str] = None
    max_volunteers: int
    registered_volunteers_count: int
    waiting_list_count: int
    # Present on list/detail reads for the current session only.  It lets a refreshed
    # client render the registration, waiting-list, or offer state without retaining it
    # in browser storage.
    my_volunteer_status: Optional[str] = None
    my_volunteer_position: Optional[int] = None
    created_at: datetime

class VolunteerResponse(BaseModel):
    id: int
    pilot_id: int
    user_id: int
    user_name: Optional[str] = None
    status: str  # registered | waiting | offered | accepted | cancelled
    skills_confirmed: bool
    position: int
    offered_at: Optional[datetime] = None
    accepted_at: Optional[datetime] = None
    created_at: datetime

class SatisfactionFeedbackRequest(BaseModel):
    role: str = Field(..., pattern="^(beneficiary|volunteer)$")
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    improvements: Optional[str] = None

class SatisfactionFeedbackResponse(BaseModel):
    id: int
    pilot_id: int
    user_id: int
    role: str
    rating: int
    comment: Optional[str] = None
    improvements: Optional[str] = None
    created_at: datetime

# Admin schemas
class MergeProblemsRequest(BaseModel):
    target_problem_id: int
    source_problem_ids: List[int] = Field(..., min_length=1)

class SplitProblemRequest(BaseModel):
    problem_id: int
    report_ids_to_detach: List[int] = Field(..., min_length=1)
    new_problem_title: str

class MergeSolutionsRequest(BaseModel):
    target_solution_id: int
    duplicate_solution_ids: List[int] = Field(..., min_length=1)


class AdminReportStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(submitted|confirmed|rejected)$")


class AdminCatalogueCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    description: str = Field(..., min_length=3)
    category: str = Field(..., min_length=1, max_length=100)
    source_url: str = Field(..., min_length=3, max_length=500)
    target_audience: str = Field("", max_length=200)
    cost_estimate: str = Field("", max_length=100)
    limitations: str = ""


class AdminCatalogueUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=300)
    description: Optional[str] = Field(None, min_length=3)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    source_url: Optional[str] = Field(None, min_length=3, max_length=500)
    target_audience: Optional[str] = Field(None, max_length=200)
    cost_estimate: Optional[str] = Field(None, max_length=100)
    limitations: Optional[str] = None


class AdminDashboardCountsResponse(BaseModel):
    """Counts calculated from persisted data for the administrator overview."""

    reports_total: int
    reports_waiting_grouping: int
    ideas_total: int
    ideas_waiting_admin: int
    pilots_total: int
    pilots_waiting_start: int

# Discussion & Notification schemas
class ThreadMessageCreateRequest(BaseModel):
    content: str = Field(..., min_length=1)

class ThreadMessageResponse(BaseModel):
    id: int
    thread_id: int
    author_id: int
    author_name: str
    is_ai: bool = False
    content: str
    created_at: datetime

class DiscussionThreadResponse(BaseModel):
    id: int
    idea_id: int
    title: str
    created_at: datetime
    messages: List[ThreadMessageResponse] = []


class AIDiscussionRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

# Adaptation schema
class InstitutionAdaptationRequest(BaseModel):
    solution_id: int
    beneficiaries: str
    location: str
    resources: str
    budget: str
    constraints: str

class InstitutionAdaptationResponse(BaseModel):
    id: int
    user_id: int
    solution_id: int
    beneficiaries: str
    location: str
    resources: str
    budget: str
    constraints: str
    draft_adaptation: Optional[str] = None
    solution_title: Optional[str] = None
    source_url: Optional[str] = None
    created_at: datetime

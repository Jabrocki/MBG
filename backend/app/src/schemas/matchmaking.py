from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# Auth schemas
class DemoLoginRequest(BaseModel):
    role: str = Field(..., description="Target demo role: 'user' or 'admin'")

class DemoTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    user_name: str

class UserResponse(BaseModel):
    id: int
    name: str
    surname: str
    email: str
    role: str
    is_anonymous_by_default: bool

# Report schemas
class ReportCreateRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Opis problemu społecznego")
    location_lat: float = Field(..., description="Szerokość geograficzna (WGS84)")
    location_lon: float = Field(..., description="Długość geograficzna (WGS84)")
    location_type: str = Field("map", description="Źródło lokalizacji: map | manual | gps")
    location_name: Optional[str] = Field("Małopolska", description="Nazwa miejscowości / dzielnicy")

class CategoryCorrectionRequest(BaseModel):
    categories: List[str] = Field(..., min_length=1)

class ReportResponse(BaseModel):
    id: int
    text_raw: str
    location_lat: float
    location_lon: float
    location_type: str
    location_name: str
    categories: List[str]
    audience: str
    urgency: str
    duration: str
    is_urgent: bool
    status: str
    canonical_problem_id: Optional[int]
    created_at: datetime
    expires_at: datetime
    # Anonymized for public, visible only to admins
    author_name: Optional[str] = None
    urgent_guidance: Optional[str] = None

class ProblemCandidateResponse(BaseModel):
    problem_id: int
    title: str
    confidence: float

class ReportSubmissionResult(BaseModel):
    report: ReportResponse
    suggested_candidates: List[ProblemCandidateResponse]

class ConfirmGroupingRequest(BaseModel):
    confirmed_problem_id: Optional[int] = Field(None, description="ID istniejącego problemu lub null jeśli tworzymy nowy")
    create_new: bool = Field(False, description="Ustaw True aby utworzyć nowy problem kanoniczny")

# Problem schemas
class CanonicalProblemResponse(BaseModel):
    id: int
    title: str
    generated_description: str
    reporter_count: int
    location_centroid_lat: float
    location_centroid_lon: float
    status: str
    recurrence_recommended: bool
    created_at: datetime

# Matchmaking schemas
class InnovationMatchResponse(BaseModel):
    solution_id: int
    title: str
    description: str
    rank: int
    score: float
    explanation: str
    limitations: str
    source_url: Optional[str] = None
    coord_x: float
    coord_y: float
    coord_z: float

class MatchListResponse(BaseModel):
    problem_id: int
    total_matches: int
    matches: List[InnovationMatchResponse]

# Coordinates 3D
class Coordinate3D(BaseModel):
    id: int
    entity_type: str
    title: str
    x: float
    y: float
    z: float

class CoordinatesResponse(BaseModel):
    problem_id: int
    problem_coords: Coordinate3D
    solution_coords: List[Coordinate3D]

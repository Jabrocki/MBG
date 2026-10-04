from datetime import datetime
from typing import Literal, Optional, List
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


class RegisterRequest(BaseModel):
    """A public registration request; only the regular user role can be created here."""

    name: str = Field(..., min_length=1, max_length=100)
    surname: str = Field("", max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=10, max_length=256)
    is_anonymous_by_default: bool = True


class PasswordLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=256)

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


class ReportListResponse(BaseModel):
    """A pageless, permission-filtered prototype projection of reports."""
    reports: List[ReportResponse]

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


# Geographic map schemas.  They deliberately differ from the semantic 3D coordinates
# above: these are WGS84 positions suitable for a conventional map.
class MapCenterResponse(BaseModel):
    lat: float
    lon: float


class MapMarkerResponse(BaseModel):
    """A privacy-aware geographic marker returned to an authenticated map view.

    ``precision`` tells the UI whether a point represents the owner's exact report,
    an intentionally rounded aggregate, or an innovation's city/municipality.  The
    client must show that distinction instead of presenting every pin as exact.
    """

    id: str
    entity_type: Literal["report", "problem", "innovation", "pilot"]
    entity_id: int
    title: str
    lat: float
    lon: float
    location_name: str
    precision: Literal["exact", "area", "aggregate", "municipality"]
    visibility: Literal["private", "admin", "authenticated"]
    distance_km: Optional[float] = None
    reporter_count: Optional[int] = None
    status: Optional[str] = None
    category: Optional[str] = None
    source_url: Optional[str] = None


class MapMarkerCountsResponse(BaseModel):
    reports: int = 0
    problems: int = 0
    innovations: int = 0
    pilots: int = 0
    innovations_without_known_location: int = 0


class MapMarkersResponse(BaseModel):
    center: Optional[MapCenterResponse] = None
    radius_km: Optional[float] = None
    markers: List[MapMarkerResponse]
    counts: MapMarkerCountsResponse


class LocalitySearchResult(BaseModel):
    """OpenStreetMap/Nominatim result constrained to Małopolska."""

    name: str
    latitude: float
    longitude: float
    display_name: str

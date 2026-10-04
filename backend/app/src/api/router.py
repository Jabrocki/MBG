from fastapi import APIRouter
from src.api.auth import router as auth_router
from src.api.reports import router as reports_router
from src.api.problems import router as problems_router
from src.api.catalogue import router as catalogue_router
from src.api.ideas import router as ideas_router
from src.api.votes import router as votes_router
from src.api.pilots import router as pilots_router
from src.api.admin import router as admin_router
from src.api.discussions import router as discussions_router
from src.api.geography import router as geography_router
from src.api.public_stats import router as public_stats_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(reports_router)
api_router.include_router(problems_router)
api_router.include_router(catalogue_router)
api_router.include_router(ideas_router)
api_router.include_router(votes_router)
api_router.include_router(pilots_router)
api_router.include_router(admin_router)
api_router.include_router(discussions_router)
api_router.include_router(geography_router)
api_router.include_router(public_stats_router)

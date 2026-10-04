"""Safe, idempotent command for materialising domain locations.

Run from ``backend/app`` with the regular database environment:
``python -m src.scripts.backfill_geo_locations``.
"""

from __future__ import annotations

import json

from src.db.base import Base
from src.db.session import SessionLocal, engine
from src.models.geo_location import EntityGeoLocation  # Ensure metadata contains the new compatible table.
from src.services.geo_location_service import EntityGeoLocationService


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        stats = EntityGeoLocationService(db).backfill_all()
    print(json.dumps(stats, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()

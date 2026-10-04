"""Import generated Małopolska problems and reports into the application database.

The markdown corpus is only source data; the UI reads relational records. This script
materialises it once and keeps every synthetic report attached to one synthetic problem.
"""
from __future__ import annotations

import re
from datetime import timedelta
from pathlib import Path

from sqlalchemy import select

from src.db.session import SessionLocal
from src.models.problem import CanonicalProblem, ReportProblemLink
from src.models.report import Report
from src.models.user import User
from src.services.geo_location_service import EntityGeoLocationService, LOCALITIES
from src.utils.datetime_utils import utc_now

ROOT = Path(__file__).resolve().parents[2] / "data"


def field(text: str, heading: str, default: str = "") -> str:
    match = re.search(rf"(?:^|\n)##\s+{re.escape(heading)}\s*\n+(.+?)(?=\n##\s|\Z)", text, re.I | re.S)
    return " ".join(match.group(1).strip().split()) if match else default


def title(text: str, default: str) -> str:
    match = re.search(r"^#\s+(.+)$", text, re.M)
    return match.group(1).strip() if match else default


def locality_coords(text: str) -> tuple[str, float, float]:
    locality = field(text, "Lokalizacja", "Małopolska")[:255]
    # EntityGeoLocationService uses the same curated Małopolska locality table.
    normal = locality.casefold()
    for item in LOCALITIES:
        if item.name.casefold() in normal:
            return locality, item.latitude, item.longitude
    # The service's backfill will resolve any declared known locality. Keep unknown
    # records inside the province until a later curated locality update.
    return locality, 50.0619, 19.9368


def import_records() -> tuple[int, int]:
    problem_files = sorted((ROOT / "problems").glob("synthetic-problem-*.md"))
    report_file = ROOT / "submissions" / "synthetic_reports.md"
    with SessionLocal() as db:
        synthetic_user = db.execute(select(User).where(User.email == "synthetic@mbg.local")).scalar_one_or_none()
        if not synthetic_user:
            synthetic_user = User(
                email="synthetic@mbg.local", name="Dane syntetyczne", surname="MBG",
                role="user", is_anonymous_by_default=True,
            )
            db.add(synthetic_user)
            db.flush()

        problems_by_locality: dict[str, CanonicalProblem] = {}
        created_problems = 0
        for path in problem_files:
            raw = path.read_text(encoding="utf-8")
            problem_title = title(raw, path.stem)[:300]
            description = field(raw, "Opis zgłoszenia", problem_title)
            locality, lat, lon = locality_coords(raw)
            existing = db.execute(
                select(CanonicalProblem).where(CanonicalProblem.title == problem_title)
            ).scalars().first()
            if not existing:
                existing = CanonicalProblem(
                    title=problem_title,
                    generated_description=description,
                    reporter_count=0,
                    location_centroid_lat=lat,
                    location_centroid_lon=lon,
                    status="active",
                    created_at=utc_now(),
                )
                db.add(existing)
                db.flush()
                created_problems += 1
            problems_by_locality.setdefault(locality.casefold(), existing)
            EntityGeoLocationService(db).persist_problem(existing)

        created_reports = 0
        if report_file.exists():
            raw_reports = report_file.read_text(encoding="utf-8")
            chunks = re.split(r"(?=^##\s+\d+\.\s+)", raw_reports, flags=re.M)
            for chunk in chunks:
                heading = re.match(r"^##\s+\d+\.\s+(.+)$", chunk, re.M)
                if not heading:
                    continue
                report_title = heading.group(1).strip()
                locality = field(chunk, "Lokalizacja", "Małopolska")[:255]
                body = chunk.split("\n\n", 2)[-1].strip()
                expected = field(chunk, "Oczekiwana zmiana")
                text_raw = f"{report_title}. {body} {expected}".strip()[:4000]
                problem = next((p for key, p in problems_by_locality.items() if key in locality.casefold() or locality.casefold() in key), None)
                if not problem:
                    problem = CanonicalProblem(
                        title=report_title[:300], generated_description=text_raw[:4000],
                        reporter_count=0, location_centroid_lat=50.0619,
                        location_centroid_lon=19.9368, status="active", created_at=utc_now(),
                    )
                    db.add(problem)
                    db.flush()
                    problems_by_locality[locality.casefold()] = problem
                    created_problems += 1
                existing_report = db.execute(
                    select(Report).where(Report.author_id == synthetic_user.id, Report.text_raw == text_raw)
                ).scalars().first()
                if existing_report:
                    continue
                report = Report(
                    author_id=synthetic_user.id, text_raw=text_raw,
                    location_lat=problem.location_centroid_lat, location_lon=problem.location_centroid_lon,
                    location_type="manual", location_name=locality, categories=["syntetyczne"],
                    audience="Mieszkańcy", urgency="standard", duration="nieznany",
                    is_urgent=False, canonical_problem_id=problem.id, status="confirmed",
                    created_at=utc_now(), expires_at=utc_now() + timedelta(days=3650),
                )
                db.add(report)
                db.flush()
                db.add(ReportProblemLink(
                    report_id=report.id, problem_id=problem.id, confidence=1.0,
                    status="confirmed", confirmed_at=utc_now(),
                ))
                problem.reporter_count += 1
                EntityGeoLocationService(db).persist_report(report)
                created_reports += 1

        db.commit()
        return created_problems, created_reports


if __name__ == "__main__":
    print(import_records())

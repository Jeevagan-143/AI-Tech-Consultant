
from pathlib import Path
from datetime import datetime
import json

from fastapi import FastAPI, HTTPException
from schemas import ScopeRequest, ScopeChangeRequest
from agents import (
    extract_requirements,
    check_feasibility,
    create_scope,
    create_proposal,
    compare_scopes,
)

app = FastAPI(title="AI Tech Consultant - Meeting-to-Scope")

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)


@app.get("/health")
def health():
    return {"status": "ok", "service": "meeting-to-scope"}


@app.post("/scope")
def generate_scope(request: ScopeRequest):
    try:
        requirements = extract_requirements(request.transcript)
        feasibility = check_feasibility(requirements)
        scope = create_scope(requirements, feasibility)
        proposal = create_proposal(
            request.project_name,
            request.client_name,
            requirements,
            feasibility,
            scope,
        )

        result = {
            "project_name": request.project_name,
            "client_name": request.client_name,
            "requirements": requirements,
            "feasibility": feasibility,
            "scope": scope,
            "estimated_hours": scope["estimated_hours"],
            "proposal": proposal,
            "human_review_required": True,
        }

        filename = "scope_" + datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        ) + ".json"

        (OUTPUT_DIR / filename).write_text(
            json.dumps(result, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        result["saved_file"] = filename
        return result

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc


@app.post("/scope/diff")
def scope_diff(request: ScopeChangeRequest):
    try:
        return compare_scopes(
            request.original_scope,
            request.revised_scope,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/outputs")
def list_outputs():
    files = sorted(
        p.name for p in OUTPUT_DIR.glob("scope_*.json")
    )
    return {"count": len(files), "files": files}

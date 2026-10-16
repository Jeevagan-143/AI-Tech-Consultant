
import json
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parent
CASES_FILE = BASE_DIR / "test_cases.json"
RESULTS_FILE = BASE_DIR / "eval_results.json"
API_URL = "http://127.0.0.1:8001/scope"

cases = json.loads(CASES_FILE.read_text(encoding="utf-8"))
results = []

for case in cases:
    print(f"Running {case['id']}...")

    payload = {
        "project_name": f"Evaluation {case['id']}",
        "client_name": "Evaluation Client",
        "transcript": case["transcript"],
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=180)
        item = {
            "id": case["id"],
            "http_status": response.status_code,
            "passed_api": response.status_code == 200,
        }

        if response.ok:
            data = response.json()
            scope = data.get("scope", {})
            requirements = data.get("requirements", {})
            feasibility = data.get("feasibility", {})

            item["estimated_hours"] = data.get("estimated_hours")
            item["has_requirements"] = bool(requirements)
            item["has_scope"] = bool(scope.get("in_scope"))
            item["has_proposal"] = bool(data.get("proposal"))
            item["human_review_required"] = data.get(
                "human_review_required"
            )
            item["feasibility_status"] = feasibility.get(
                "feasibility_status"
            )
            item["saved_file"] = data.get("saved_file")

            # Simple automated checks; these do not judge factual quality.
            item["passed_structure"] = all([
                item["has_requirements"],
                item["has_scope"],
                item["has_proposal"],
                isinstance(item["estimated_hours"], (int, float)),
                item["human_review_required"] is True,
            ])
        else:
            item["error"] = response.text[:1000]

    except requests.RequestException as exc:
        item = {
            "id": case["id"],
            "passed_api": False,
            "error": str(exc),
        }

    results.append(item)
    print(json.dumps(item, indent=2))

RESULTS_FILE.write_text(
    json.dumps(results, indent=2, ensure_ascii=False),
    encoding="utf-8",
)

total = len(results)
api_passed = sum(r.get("passed_api", False) for r in results)
structure_passed = sum(r.get("passed_structure", False) for r in results)

print("\n=== EVALUATION SUMMARY ===")
print(f"Cases: {total}")
print(f"API successful: {api_passed}/{total}")
print(f"Structure checks passed: {structure_passed}/{total}")
print(f"Results saved to: {RESULTS_FILE}")

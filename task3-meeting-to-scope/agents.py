
import os
import json
import re
import requests
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None
MODEL = "openai/gpt-oss-20b"
KNOWLEDGE_API_URL = os.getenv(
    "KNOWLEDGE_API_URL", "http://127.0.0.1:8000"
).rstrip("/")


def call_llm(system_prompt, user_prompt):
    if client is None:
        raise RuntimeError("GROQ_API_KEY missing in root .env")

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=2500,
    )
    return response.choices[0].message.content or ""


def parse_json(text):
    cleaned = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        text.strip(),
        flags=re.IGNORECASE,
    )
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start < 0 or end < start:
        raise ValueError("Model did not return JSON.")
    return json.loads(cleaned[start:end + 1])


def extract_requirements(transcript):
    prompt = """
You are a business analyst. Extract only facts from the meeting.
Return valid JSON only with keys:
project_goal, requested_features, user_roles, integrations,
design_preferences, constraints, acceptance_criteria, open_questions,
assumptions, risks.
Use arrays for lists. Do not invent decisions. List missing details
under open_questions.
"""
    return parse_json(call_llm(prompt, transcript))


def check_feasibility(requirements):
    evidence = []
    question = (
        "Assess feasibility of these project requirements using "
        "available support documentation: "
        + json.dumps(requirements, ensure_ascii=False)
    )

    # Try the existing Knowledge Brain API routes.
    for route in ("/ask", "/query", "/chat"):
        try:
            response = requests.post(
                KNOWLEDGE_API_URL + route,
                json={"question": question, "query": question},
                timeout=8,
            )
            if response.ok:
                evidence.append({
                    "route": route,
                    "response": response.json(),
                })
                break
        except (requests.RequestException, ValueError):
            continue

    prompt = """
You are a technical feasibility analyst.
Use only the supplied Knowledge Brain response as documentation evidence.
Do not claim support without evidence. Clearly identify unknowns.
Return JSON only with keys:
feasibility_status, feasible_items, uncertain_items, blockers,
knowledge_evidence, recommended_next_steps.
If no documentation was retrieved, say that feasibility is unverified.
"""
    result = parse_json(call_llm(
        prompt,
        json.dumps({
            "requirements": requirements,
            "knowledge_brain_results": evidence,
        }, ensure_ascii=False),
    ))
    result["knowledge_brain_evidence_available"] = bool(evidence)
    return result


def create_scope(requirements, feasibility):
    prompt = """
You are a project delivery manager.
Create a realistic, actionable project scope.
Do not invent approved requirements. Mark assumptions and open questions.
Return JSON only with keys:
in_scope, out_of_scope, deliverables, milestones, dependencies,
acceptance_criteria, assumptions, risks, estimated_hours.
Lists should be arrays. estimated_hours must be numeric.
"""
    result = parse_json(call_llm(
        prompt,
        json.dumps({
            "requirements": requirements,
            "feasibility": feasibility,
        }, ensure_ascii=False),
    ))
    result["estimated_hours"] = float(result["estimated_hours"])
    return result


def create_proposal(project_name, client_name, requirements,
                    feasibility, scope):
    prompt = """
Write a professional Markdown project proposal with objective,
deliverables, exclusions, milestones, estimated hours, dependencies,
assumptions, risks, acceptance criteria, and next steps.
Never invent prices or deadlines. State that human review is required.
"""
    return call_llm(prompt, json.dumps({
        "project_name": project_name,
        "client_name": client_name,
        "requirements": requirements,
        "feasibility": feasibility,
        "scope": scope,
    }, ensure_ascii=False))


def compare_scopes(original_scope, revised_scope):
    prompt = """
Compare the two scopes. Return JSON only with keys:
added, removed, changed, original_estimated_hours,
revised_estimated_hours, hour_difference, requires_reapproval.
Identify scope creep. Use arrays for added, removed, changed.
Require reapproval if scope or hours materially change.
"""
    result = parse_json(call_llm(
        prompt,
        json.dumps({
            "original_scope": original_scope,
            "revised_scope": revised_scope,
        }, ensure_ascii=False),
    ))
    result["human_review_required"] = True
    return result

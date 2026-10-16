
import json
from pathlib import Path

folder = Path(__file__).resolve().parent
file = folder / "test_cases.json"
cases = json.loads(file.read_text(encoding="utf-8"))

extra = [
    ("Restaurant Website", "A restaurant needs a menu, opening hours, location map and contact form. Branding is undecided."),
    ("Online Course Platform", "A training provider needs course pages, student registration and progress tracking. Payment requirements are undecided."),
    ("Portfolio Website", "A photographer needs a responsive portfolio, gallery, biography and enquiry form."),
    ("Booking Website", "A salon needs service listings and appointment booking. The booking provider is not selected."),
    ("Ecommerce Website", "A shop wants product pages, search, cart and checkout. Payment gateway and shipping rules are undecided."),
    ("School Website", "A school needs admissions information, staff profiles, events and a contact form."),
    ("Medical Clinic Website", "A clinic wants doctor profiles, opening hours and appointment requests. Privacy requirements need clarification."),
    ("Real Estate Directory", "A property agency needs property listings, location filters and enquiry forms. Listing data is not ready."),
    ("Nonprofit Website", "A nonprofit needs its mission, projects, volunteer registration and donation functionality. Donation provider is undecided."),
    ("Travel Website", "A travel agency needs destination pages, tour packages and enquiry forms. Booking and payment integrations are undecided."),
    ("Redesign Project", "A client wants a mobile-friendly redesign of an existing website. Platform, migration and launch date are unknown."),
    ("Membership Website", "A community wants member profiles, login and restricted content. Subscription and payment requirements are not confirmed."),
    ("Event Website", "An event organizer needs event pages, schedules, speaker profiles and registration. Ticket payment is undecided."),
    ("Service Marketplace", "A client wants customer and provider accounts, searchable services and reviews. Moderation and payment rules need confirmation."),
    ("Incomplete Brief", "Client says they want a website but has not decided the purpose, audience, features, budget or deadline.")
]

for i, (name, transcript) in enumerate(extra, start=6):
    cases.append({
        "id": f"T3-{i:02d}",
        "transcript": f"Client project: {name}. {transcript}",
        "expected_features": [],
        "expected_open_questions": []
    })

file.write_text(
    json.dumps(cases, indent=2, ensure_ascii=False),
    encoding="utf-8"
)
print(f"Total evaluation cases: {len(cases)}")

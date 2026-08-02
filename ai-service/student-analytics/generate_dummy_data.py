"""
Generate a dummy dataset for the student-analytics project.

Produces one Excel file (data/student_data.xlsx) with 4 sheets:
    1. students          - one row per student (profile)
    2. exams             - the exam catalogue (needed by the recommender)
    3. attempts          - one row per exam attempt, with a date
    4. topic_performance - one row per attempt per topic  (key sheet for segmentation)

The data is NOT pure random noise. Each student is assigned one of 5 personas,
and their numbers are biased toward that persona so that clustering later actually
finds meaningful groups instead of noise.
"""

import os
import random
from datetime import date, timedelta

import numpy as np
import pandas as pd

# Reproducible output so the file is the same every run.
random.seed(42)
np.random.seed(42)

# ---------------------------------------------------------------------------
# Fixed lists to pick from
# ---------------------------------------------------------------------------
GRADE_LEVELS = ["9th", "10th", "11th", "12th"]
GOALS = ["JEE", "NEET", "Banking", "UPSC"]
DOMAINS = ["Physics", "Math", "Biology", "GK"]

# Topics grouped by domain (5 topics each).
TOPICS_BY_DOMAIN = {
    "Physics": ["Mechanics", "Optics", "Thermodynamics", "Electromagnetism", "Waves"],
    "Math": ["Algebra", "Geometry", "Calculus", "Trigonometry", "Probability"],
    "Biology": ["Genetics", "Ecology", "Human Physiology", "Cell Biology", "Botany"],
    "GK": ["History", "Geography", "Polity", "Economy", "Current Affairs"],
}

# Which goals each domain is relevant to. Drives the exam catalogue's goal tags
# and, later, the recommender's eligibility filter.
GOALS_BY_DOMAIN = {
    "Physics": ["JEE", "NEET"],
    "Math": ["JEE", "Banking"],
    "Biology": ["NEET"],
    "GK": ["Banking", "UPSC"],
}

# Difficulty tiers, expressed on the same theta scale as irt_theta so the
# recommender can compare "how hard is this exam" against "how good is this student".
DIFFICULTY_TIERS = {
    "foundation": -1.0,
    "easy": -0.4,
    "moderate": 0.2,
    "advanced": 0.9,
    "elite": 1.6,
}

# Which grades each tier is aimed at.
GRADES_BY_TIER = {
    "foundation": ["9th", "10th"],
    "easy": ["9th", "10th", "11th"],
    "moderate": ["10th", "11th", "12th"],
    "advanced": ["11th", "12th"],
    "elite": ["12th"],
}

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
    "Ishaan", "Rohan", "Ananya", "Diya", "Aadhya", "Saanvi", "Pari", "Riya",
    "Ira", "Myra", "Kiara", "Anika", "Kabir", "Advik", "Dhruv", "Kayra",
    "Navya", "Aryan", "Ayaan", "Meera", "Tara", "Nikhil", "Sneha", "Kavya",
    "Priya", "Rahul", "Neha", "Karan", "Pooja", "Manav", "Isha", "Varun",
    "Tanvi", "Yash", "Simran", "Dev", "Ritika", "Nisha", "Aman", "Kritika",
    "Harsh", "Zara",
]

# ---------------------------------------------------------------------------
# Personas: each controls how a student's numbers are biased.
#   base_acc          -> mean overall accuracy (%)
#   time_factor       -> multiplier on avg time (1.0 = normal, <1 fast, >1 slow)
#   answer_changes    -> mean answer-change count per topic (carelessness proxy)
#   weak_topic        -> if True, one random topic is dragged much lower
#   weight            -> sampling probability, so every persona gets enough students
#                        to survive clustering
# ---------------------------------------------------------------------------
PERSONAS = {
    "all_rounder":         dict(base_acc=78, acc_spread=6,  time_factor=1.00, answer_changes=2, weak_topic=False, weight=0.22),
    "weak_in_one_topic":   dict(base_acc=72, acc_spread=7,  time_factor=1.05, answer_changes=3, weak_topic=True,  weight=0.22),
    "fast_but_careless":   dict(base_acc=58, acc_spread=10, time_factor=0.65, answer_changes=6, weak_topic=False, weight=0.20),
    "slow_but_accurate":   dict(base_acc=82, acc_spread=5,  time_factor=1.45, answer_changes=1, weak_topic=False, weight=0.18),
    "consistently_weak":   dict(base_acc=44, acc_spread=8,  time_factor=1.10, answer_changes=4, weak_topic=False, weight=0.18),
}
PERSONA_NAMES = list(PERSONAS.keys())
PERSONA_WEIGHTS = [PERSONAS[p]["weight"] for p in PERSONA_NAMES]


def theta_from_accuracy(acc_pct):
    """Map an accuracy % (roughly 30-95) to an IRT theta in about [-3, 3]."""
    theta = (acc_pct - 60) / 12.0
    return round(float(np.clip(theta + np.random.normal(0, 0.2), -3, 3)), 2)


def clip_pct(x):
    return float(np.clip(x, 3, 99))


# ---------------------------------------------------------------------------
# Exam catalogue
#
# One exam per (domain, tier, variant). Every exam declares the topics it covers
# so the recommender can match exams against a student's weak topics, plus the
# metadata the eligibility filter needs (goals, grades, difficulty).
# ---------------------------------------------------------------------------
VARIANTS_PER_TIER = 2

exam_rows = []
for domain, topics in TOPICS_BY_DOMAIN.items():
    for tier, difficulty in DIFFICULTY_TIERS.items():
        for variant in range(1, VARIANTS_PER_TIER + 1):
            # Full-syllabus papers at the top tiers, focused papers lower down.
            if tier in ("advanced", "elite"):
                covered = list(topics)
            else:
                covered = random.sample(topics, k=random.randint(2, 4))

            n_questions = random.choice([20, 25, 30, 40])
            exam_rows.append(
                dict(
                    exam_id=f"E_{domain[:3].upper()}_{tier[:4].upper()}_{variant}",
                    exam_name=f"{domain} {tier.title()} Test {variant}",
                    domain=domain,
                    tier=tier,
                    difficulty=difficulty,
                    topics_covered="|".join(sorted(covered)),
                    target_goals="|".join(GOALS_BY_DOMAIN[domain]),
                    target_grades="|".join(GRADES_BY_TIER[tier]),
                    n_questions=n_questions,
                    duration_minutes=int(n_questions * random.choice([1.0, 1.5, 2.0])),
                )
            )

exams_df = pd.DataFrame(exam_rows)

# Exams a student can actually sit, grouped by domain. The attempt loop below
# picks from here so that every attempt points at a real catalogue row.
EXAMS_BY_DOMAIN = {d: g["exam_id"].tolist() for d, g in exams_df.groupby("domain")}
EXAM_META = exams_df.set_index("exam_id").to_dict("index")

# ---------------------------------------------------------------------------
# Build the student / attempt / topic tables
# ---------------------------------------------------------------------------
N_STUDENTS = 400
END_DATE = date(2026, 7, 1)  # attempts are spread over the 6 months before this

students_rows = []
attempts_rows = []
topic_rows = []

attempt_counter = 0

for i in range(1, N_STUDENTS + 1):
    student_id = f"S{i:04d}"
    name = random.choice(FIRST_NAMES)
    grade = random.choice(GRADE_LEVELS)
    # Age tracks grade with a little slack, instead of being independent of it.
    age = GRADE_LEVELS.index(grade) + 14 + random.choice([-1, 0, 0, 1])
    goal = random.choice(GOALS)
    preferred_domain = random.choice(DOMAINS)
    persona = random.choices(PERSONA_NAMES, weights=PERSONA_WEIGHTS, k=1)[0]
    p = PERSONAS[persona]

    students_rows.append(
        dict(
            student_id=student_id,
            name=name,
            age=age,
            grade_level=grade,
            goal=goal,
            preferred_domain=preferred_domain,
            persona=persona,  # kept as ground-truth label to check clusters against later
        )
    )

    # 1-5 attempts, each on a distinct domain (prefer the student's own domain first).
    n_attempts = random.randint(1, 5)
    domain_pool = [preferred_domain] + [d for d in DOMAINS if d != preferred_domain]
    # Allow revisiting a domain once the four distinct ones are used up.
    chosen_domains = (domain_pool * 2)[:n_attempts]

    # Attempt dates: walk backwards from a random recent day so each student has
    # a plausible test history rather than all attempts on the same date.
    latest = END_DATE - timedelta(days=random.randint(0, 45))
    gaps = [random.randint(7, 30) for _ in range(n_attempts)]
    attempt_dates = []
    cursor = latest
    for gap in gaps:
        attempt_dates.append(cursor)
        cursor = cursor - timedelta(days=gap)
    attempt_dates.reverse()  # oldest first

    # Students improve a little over their test history.
    improvement_per_attempt = np.random.uniform(0.5, 2.5)

    for attempt_index, (exam_domain, attempt_date) in enumerate(zip(chosen_domains, attempt_dates)):
        attempt_counter += 1
        attempt_id = f"A{attempt_counter:05d}"
        exam_id = random.choice(EXAMS_BY_DOMAIN[exam_domain])
        meta = EXAM_META[exam_id]

        # Only the topics this exam actually covers get a row.
        topics = meta["topics_covered"].split("|")

        # Pick which topic is the "weak" one for this attempt (persona-dependent).
        weak_topic = random.choice(topics) if p["weak_topic"] else None

        # A harder paper pushes accuracy down; an easier one lifts it.
        difficulty_penalty = meta["difficulty"] * 7.0

        total_correct = 0
        total_attempted = 0
        total_time_seconds = 0

        for topic in topics:
            q_attempted = random.randint(5, 12)

            mean_acc = np.random.normal(p["base_acc"], p["acc_spread"])
            mean_acc += improvement_per_attempt * attempt_index
            mean_acc -= difficulty_penalty
            if topic == weak_topic:
                mean_acc -= 30  # drag the single weak topic down hard
            acc_pct = clip_pct(mean_acc)

            correct = int(round(q_attempted * acc_pct / 100.0))
            correct = max(0, min(q_attempted, correct))
            acc_pct = round(100.0 * correct / q_attempted, 1)

            base_time = np.random.normal(60, 12)  # ~60s/question baseline
            # Harder papers take longer per question.
            avg_time = round(max(8.0, base_time * p["time_factor"] * (1 + 0.10 * meta["difficulty"])), 1)

            changes = max(0, int(np.random.poisson(p["answer_changes"])))

            topic_rows.append(
                dict(
                    attempt_id=attempt_id,
                    topic=topic,
                    questions_attempted=q_attempted,
                    correct_count=correct,
                    accuracy_pct=acc_pct,
                    avg_time_seconds=avg_time,
                    answer_changes_total=changes,
                )
            )

            total_correct += correct
            total_attempted += q_attempted
            total_time_seconds += avg_time * q_attempted

        max_score = total_attempted  # 1 mark per question
        total_score = total_correct
        overall_acc = 100.0 * total_correct / total_attempted
        percentile = round(clip_pct(overall_acc + np.random.normal(0, 4)), 1)
        irt_theta = theta_from_accuracy(overall_acc)
        time_taken_minutes = round(total_time_seconds / 60.0, 1)

        attempts_rows.append(
            dict(
                attempt_id=attempt_id,
                student_id=student_id,
                exam_id=exam_id,
                exam_domain=exam_domain,
                attempt_date=pd.Timestamp(attempt_date),
                total_score=total_score,
                max_score=max_score,
                percentile=percentile,
                irt_theta=irt_theta,
                time_taken_minutes=time_taken_minutes,
            )
        )

students_df = pd.DataFrame(students_rows)
attempts_df = pd.DataFrame(attempts_rows)
topic_df = pd.DataFrame(topic_rows)

# ---------------------------------------------------------------------------
# Write to Excel (4 sheets)
# ---------------------------------------------------------------------------
here = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(here, "data")
os.makedirs(data_dir, exist_ok=True)
out_path = os.path.join(data_dir, "student_data.xlsx")

with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
    students_df.to_excel(writer, sheet_name="students", index=False)
    exams_df.to_excel(writer, sheet_name="exams", index=False)
    attempts_df.to_excel(writer, sheet_name="attempts", index=False)
    topic_df.to_excel(writer, sheet_name="topic_performance", index=False)

print(f"Wrote {out_path}")
print(f"  students:          {len(students_df):>5} rows")
print(f"  exams:             {len(exams_df):>5} rows")
print(f"  attempts:          {len(attempts_df):>5} rows")
print(f"  topic_performance: {len(topic_df):>5} rows")
print("\nPersona distribution:")
print(students_df["persona"].value_counts().to_string())

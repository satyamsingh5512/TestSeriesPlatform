"""Load the Excel workbook, validate it, and expose the joined frames."""

from dataclasses import dataclass

import pandas as pd

from . import config

REQUIRED_SHEETS = {
    "students": ["student_id", "name", "age", "grade_level", "goal", "preferred_domain"],
    "exams": [
        "exam_id", "domain", "tier", "difficulty", "topics_covered",
        "target_goals", "target_grades", "n_questions", "duration_minutes",
    ],
    "attempts": [
        "attempt_id", "student_id", "exam_id", "exam_domain", "attempt_date",
        "total_score", "max_score", "percentile", "irt_theta", "time_taken_minutes",
    ],
    "topic_performance": [
        "attempt_id", "topic", "questions_attempted", "correct_count",
        "accuracy_pct", "avg_time_seconds", "answer_changes_total",
    ],
}


@dataclass
class Dataset:
    students: pd.DataFrame
    exams: pd.DataFrame
    attempts: pd.DataFrame
    topics: pd.DataFrame
    # topics joined to attempts and students - the working frame for most analysis
    long: pd.DataFrame

    @property
    def as_of(self) -> pd.Timestamp:
        """The 'today' of the dataset: the most recent attempt date.

        Using the data's own horizon instead of the wall clock keeps recency
        logic reproducible when the dummy data is months old.
        """
        return self.attempts["attempt_date"].max()


def _validate(sheets: dict) -> None:
    for name, cols in REQUIRED_SHEETS.items():
        if name not in sheets:
            raise ValueError(
                f"Sheet '{name}' missing from {config.DATA_PATH}. "
                "Re-run generate_dummy_data.py to rebuild the workbook."
            )
        missing = set(cols) - set(sheets[name].columns)
        if missing:
            raise ValueError(f"Sheet '{name}' is missing columns: {sorted(missing)}")

    orphan_attempts = set(sheets["attempts"]["student_id"]) - set(sheets["students"]["student_id"])
    if orphan_attempts:
        raise ValueError(f"{len(orphan_attempts)} attempts reference unknown students")

    orphan_exams = set(sheets["attempts"]["exam_id"]) - set(sheets["exams"]["exam_id"])
    if orphan_exams:
        raise ValueError(f"attempts reference exam_ids absent from the catalogue: {sorted(orphan_exams)[:5]}")

    orphan_topics = set(sheets["topic_performance"]["attempt_id"]) - set(sheets["attempts"]["attempt_id"])
    if orphan_topics:
        raise ValueError(f"{len(orphan_topics)} topic rows reference unknown attempts")


def load(path: str = None) -> Dataset:
    path = path or config.DATA_PATH
    book = pd.ExcelFile(path)
    sheets = {name: book.parse(name) for name in book.sheet_names}
    _validate(sheets)

    students = sheets["students"].copy()
    exams = sheets["exams"].copy()
    attempts = sheets["attempts"].copy()
    topics = sheets["topic_performance"].copy()

    attempts["attempt_date"] = pd.to_datetime(attempts["attempt_date"])
    # Parsed once here so downstream code never re-splits these strings.
    exams["topics_set"] = exams["topics_covered"].apply(lambda s: set(s.split("|")))
    exams["goals_set"] = exams["target_goals"].apply(lambda s: set(s.split("|")))
    exams["grades_set"] = exams["target_grades"].apply(lambda s: set(s.split("|")))

    long = (
        topics
        .merge(
            attempts[["attempt_id", "student_id", "exam_id", "exam_domain", "attempt_date", "irt_theta"]],
            on="attempt_id",
            how="left",
        )
        .merge(
            students[["student_id", "grade_level", "goal", "preferred_domain"]],
            on="student_id",
            how="left",
        )
    )

    return Dataset(students=students, exams=exams, attempts=attempts, topics=topics, long=long)

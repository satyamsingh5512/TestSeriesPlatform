import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_analyse():
    payload = {
        "attempt_id": "123e4567-e89b-12d3-a456-426614174000",
        "responses": [
            {
                "question_id": "q1",
                "topic": "Math",
                "is_correct": True,
                "time_spent_seconds": 10,
                "marks_awarded": 4.0,
                "answer_changes": 1
            },
            {
                "question_id": "q2",
                "topic": "Math",
                "is_correct": False,
                "time_spent_seconds": 100,
                "marks_awarded": -1.0,
                "answer_changes": 2
            },
            {
                "question_id": "q3",
                "topic": "Math",
                "is_correct": True,
                "time_spent_seconds": 10,
                "marks_awarded": 4.0,
                "answer_changes": 0
            }
        ]
    }
    response = client.post("/analyse", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer_change_impact" in data
    assert data["answer_change_impact"]["total_changes"] == 2
    assert data["answer_change_impact"]["helped"] == 1
    assert data["answer_change_impact"]["hurt"] == 1
    assert "q2" in data["time_outliers"]


"""
IRT (Item Response Theory) — 1-Parameter Logistic (1PL) Model
Estimates student ability (theta) using Newton-Raphson method.
"""
import math
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter()


class IRTItem(BaseModel):
    difficulty: float   # 0.0 to 1.0, mapped to b (-3 to +3)
    is_correct: bool


class IRTRequest(BaseModel):
    attempt_id: str
    items: List[IRTItem]


def probability_correct(theta: float, b: float) -> float:
    """1PL IRT: P(correct | theta, b) = 1 / (1 + exp(-(theta - b)))"""
    return 1.0 / (1.0 + math.exp(-(theta - b)))


def difficulty_to_b(difficulty: float) -> float:
    """Map [0,1] difficulty to [-3, +3] IRT b-parameter"""
    return (difficulty - 0.5) * 6.0  # 0.0 -> -3, 0.5 -> 0, 1.0 -> +3


def estimate_theta(items: List[IRTItem], max_iter: int = 50) -> float:
    """Newton-Raphson to find maximum likelihood theta"""
    # Degenerate cases
    all_correct = all(i.is_correct for i in items)
    all_wrong = all(not i.is_correct for i in items)
    if all_correct:
        return 3.0
    if all_wrong:
        return -3.0

    theta = 0.0  # Start at average ability

    for _ in range(max_iter):
        L_prime = 0.0   # First derivative (score function)
        L_double = 0.0  # Second derivative (information)

        for item in items:
            b = difficulty_to_b(item.difficulty)
            p = probability_correct(theta, b)
            q = 1.0 - p
            u = 1.0 if item.is_correct else 0.0

            L_prime += (u - p)
            L_double -= p * q

        if L_double == 0:
            break

        delta = L_prime / L_double
        theta -= delta

        # Clamp to realistic range
        theta = max(-4.0, min(4.0, theta))

        if abs(delta) < 0.001:
            break

    return round(theta, 3)


def theta_to_label(theta: float) -> str:
    """Convert theta to a human-readable ability label"""
    if theta >= 2.5:
        return "JEE Advanced / UPSC Topper level"
    elif theta >= 1.5:
        return "JEE Mains / GATE level"
    elif theta >= 0.5:
        return "Above average — solid understanding"
    elif theta >= -0.5:
        return "Average level"
    elif theta >= -1.5:
        return "Below average — needs more practice"
    else:
        return "Foundational concepts need reinforcement"


@router.post("/irt")
def compute_irt(request: IRTRequest):
    if not request.items:
        return {"error": "No items provided"}

    theta = estimate_theta(request.items)
    label = theta_to_label(theta)

    return {
        "attempt_id": request.attempt_id,
        "theta": theta,
        "label": label,
        "item_count": len(request.items),
    }

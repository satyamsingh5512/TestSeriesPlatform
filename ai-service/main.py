from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from irt import router as irt_router
from ocr import router as ocr_router

app = FastAPI(title="EdTech AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(irt_router)
app.include_router(ocr_router, prefix="/ocr")

class QuestionAnalysis(BaseModel):
    question_id: str
    topic: str
    is_correct: Optional[bool]
    time_spent_seconds: int
    marks_awarded: float
    answer_changes: Optional[int] = 0

class AnalysisRequest(BaseModel):
    attempt_id: str
    responses: List[QuestionAnalysis]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyse")
def analyse(request: AnalysisRequest):
    responses = request.responses
    if not responses:
        return {"error": "No responses provided"}

    topic_stats = {}
    total_time = 0
    correct_count = 0
    
    change_helped = 0
    change_hurt = 0
    total_changes = 0

    for r in responses:
        t = r.topic or "General"
        if t not in topic_stats:
            topic_stats[t] = {"correct": 0, "total": 0, "time": 0}
        
        topic_stats[t]["total"] += 1
        topic_stats[t]["time"] += r.time_spent_seconds
        if r.is_correct:
            topic_stats[t]["correct"] += 1
        
        total_time += r.time_spent_seconds
        if r.is_correct:
            correct_count += 1
            
        if r.answer_changes and r.answer_changes > 0:
            total_changes += 1
            if r.is_correct:
                change_helped += 1
            else:
                change_hurt += 1

    # Generate Topic Report
    topic_report = []
    for t, stats in topic_stats.items():
        accuracy = (stats["correct"] / stats["total"]) * 100
        avg_time = stats["time"] / stats["total"]
        verdict = "Excellent" if accuracy > 80 else "Good" if accuracy > 50 else "Needs Improvement"
        topic_report.append({
            "topic": t,
            "accuracy": round(accuracy, 2),
            "avg_time": round(avg_time, 2),
            "verdict": verdict
        })

    # Weakest Topics
    weakest_topics = sorted(topic_report, key=lambda x: x["accuracy"])[:3]

    # Time Outliers (Questions > 2x average time)
    avg_time_global = total_time / len(responses) if responses else 0
    time_outliers = [
        r.question_id for r in responses 
        if r.time_spent_seconds > 2 * avg_time_global and avg_time_global > 0
    ]
    
    answer_change_impact = {
        "total_changes": total_changes,
        "helped": change_helped,
        "hurt": change_hurt
    }

    return {
        "attempt_id": request.attempt_id,
        "topic_report": topic_report,
        "weakest_topics": weakest_topics,
        "time_outliers": time_outliers,
        "answer_change_impact": answer_change_impact,
        "overall_accuracy": round((correct_count / len(responses)) * 100, 2) if responses else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uuid
import time

from model_registry import registry
from evaluator import evaluate_answer

app = FastAPI(title="TruthfulQA Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

progress_store = {}


class AskRequest(BaseModel):
    question: str
    models: List[str]


@app.get("/api/models")
async def get_models():
    return registry.get_available_models()


@app.get("/api/progress/{job_id}")
async def get_progress(job_id: str):
    return progress_store.get(job_id, {"status": "not_found"})


def run_comparison(job_id: str, question: str, selected_models: List[str]):
    results = []

    preferred_order = [
        "tinyllama",
        "phi3",
        "gemma",
        "qwen",
        "mistral",
        "llama3",
    ]

    selected = [m for m in preferred_order if m in selected_models]

    start_time = time.time()

    for idx, model_name in enumerate(selected, start=1):
        progress_store[job_id]["current"] = idx - 1
        progress_store[job_id]["model"] = model_name

        try:
            registry.unload_models()

            answer, latency = registry.generate_answer(
                model_name,
                question
            )

            metrics = evaluate_answer(question, answer)

            row = {
                "model": model_name,
                "answer": answer,
                "latency": round(latency, 2),
                **metrics
            }

        except Exception as e:
            row = {
                "model": model_name,
                "answer": f"Error: {str(e)}",
                "latency": 0,
                "truth_score": 0,
                "reliability_score": 0,
                "hallucination": False,
                "refusal": True,
                "length": 0,
                "mode": "error"
            }

        print("\n" + "=" * 90)
        print(f"MODEL: {model_name}")
        print(f"MODE: {row['mode']}")
        print(f"LATENCY: {row['latency']} sec")
        print(f"RELIABILITY: {row['reliability_score']}%")
        print(f"TRUTH SCORE: {row['truth_score']}")
        print("ANSWER:")
        print(row["answer"])
        print("=" * 90 + "\n")

        results.append(row)

        elapsed = time.time() - start_time
        completed = len(results)
        avg = elapsed / completed if completed else 0
        remaining = len(selected) - completed
        eta = round(avg * remaining, 1)

        progress_store[job_id].update({
            "status": "running",
            "current": completed,
            "total": len(selected),
            "model": model_name,
            "results": results,
            "eta": eta
        })

    valid = [r for r in results if not r["answer"].startswith("Error:")]

    winner = None
    if valid:
        winner = max(
            valid,
            key=lambda x: (x["reliability_score"], -x["latency"])
        )["model"]

    progress_store[job_id].update({
        "status": "done",
        "current": len(selected),
        "total": len(selected),
        "winner": winner,
        "results": results,
        "eta": 0
    })


@app.post("/api/ask")
async def ask_question(request: AskRequest, background_tasks: BackgroundTasks):
    if not request.models:
        raise HTTPException(status_code=400, detail="No models selected")

    job_id = str(uuid.uuid4())

    progress_store[job_id] = {
        "status": "running",
        "current": 0,
        "total": len(request.models),
        "model": None,
        "results": [],
        "winner": None,
        "eta": 0
    }

    background_tasks.add_task(
        run_comparison,
        job_id,
        request.question,
        request.models
    )

    return {
        "job_id": job_id,
        "status": "started"
    }
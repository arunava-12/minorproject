from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uuid

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


@app.post("/api/ask")
async def ask_question(request: AskRequest):
    if not request.models:
        raise HTTPException(status_code=400, detail="No models selected")

    job_id = str(uuid.uuid4())

    progress_store[job_id] = {
        "status": "running",
        "current": 0,
        "total": len(request.models),
        "model": None,
        "results": []
    }

    results = []

    preferred_order = [
        "tinyllama", "phi3", "gemma",
        "qwen", "mistral", "llama3"
    ]

    selected = [m for m in preferred_order if m in request.models]

    for idx, model_name in enumerate(selected, start=1):
        progress_store[job_id]["current"] = idx
        progress_store[job_id]["model"] = model_name

        try:
            registry.unload_models()

            answer, latency = registry.generate_answer(
                model_name,
                request.question
            )

            metrics = evaluate_answer(request.question, answer)

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
        progress_store[job_id]["results"] = results

    valid = [r for r in results if not r["answer"].startswith("Error:")]

    winner = None
    if valid:
        winner = max(
            valid,
            key=lambda x: (x["reliability_score"], -x["latency"])
        )["model"]

    progress_store[job_id]["status"] = "done"
    progress_store[job_id]["winner"] = winner

    return {
        "job_id": job_id,
        "question": request.question,
        "results": results,
        "winner": winner
    }
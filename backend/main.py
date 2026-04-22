from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import json
import pandas as pd
from typing import List, Optional
from pydantic import BaseModel

from model_registry import registry
from evaluator import evaluate_answer

app = FastAPI(title="TruthfulQA Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for plots
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS_DIR = os.path.join(BASE_DIR, "results")
if os.path.exists(RESULTS_DIR):
    app.mount("/api/plots", StaticFiles(directory=RESULTS_DIR), name="plots")

class AskRequest(BaseModel):
    question: str
    models: List[str]

@app.get("/api/models")
async def get_models():
    return registry.get_available_models()

@app.get("/api/history")
async def get_history():
    summary_path = os.path.join(RESULTS_DIR, "summary_results.csv")
    if not os.path.exists(summary_path):
        return {"error": "Summary results not found"}
    
    df = pd.read_csv(summary_path)
    # Convert to list of dicts
    history = df.to_dict(orient="records")
    
    # Also look for detailed metrics in subfolders
    for item in history:
        model_name = item.get("Model")
        metrics_path = os.path.join(RESULTS_DIR, str(model_name), "metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                item["details"] = json.load(f)
                
    return history

@app.post("/api/ask")
async def ask_question(request: AskRequest):
    results = []
    
    for model_name in request.models:
        try:
            # 1. Run real local inference
            answer, latency = registry.generate_answer(model_name, request.question)
            
            # 2. Evaluate answer
            eval_results = evaluate_answer(request.question, answer)
            
            results.append({
                "model": model_name,
                "answer": answer,
                "latency": round(latency, 2),
                **eval_results
            })
        except Exception as e:
            print(f"Error processing {model_name}: {e}")
            results.append({
                "model": model_name,
                "answer": f"Error: {str(e)}",
                "latency": 0,
                "truth_score": 0,
                "hallucination": False,
                "refusal": True,
                "length": 0
            })
            
    # Determine winner (highest truth score, then lowest latency)
    winner = None
    if results:
        # Filter out errors
        valid_results = [r for r in results if not r["answer"].startswith("Error:")]
        if valid_results:
            winner = max(valid_results, key=lambda x: (x["reliability_score"], -x["latency"]))["model"]

    return {
        "question": request.question,
        "results": results,
        "winner": winner
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

const API_BASE_URL = "http://localhost:8000/api";

export interface EvaluationResult {
  model: string;
  answer: string;
  latency: number;
  truth_score: number;
  reliability_score: number;
  hallucination: boolean;
  refusal: boolean;
  length: number;
}

export interface AskResponse {
  question: string;
  results: EvaluationResult[];
  winner: string;
}

export interface ModelHistory {
  Model: string;
  Accuracy: number;
  "Hallucination Rate": number;
  "Truth Score": number;
  details?: any;
}

export async function getModels(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/models`);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function askQuestion(question: string, models: string[]): Promise<AskResponse> {
  const res = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, models }),
  });
  if (!res.ok) throw new Error("Failed to get response from models");
  return res.json();
}

export async function getHistory(): Promise<ModelHistory[]> {
  const res = await fetch(`${API_BASE_URL}/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

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
  mode?: string;
}

export interface AskStartResponse {
  job_id: string;
  status: string;
}

export interface ProgressResponse {
  status: string;
  current: number;
  total: number;
  model: string | null;
  eta: number;
  winner?: string | null;
  results: EvaluationResult[];
}

export interface AskResponse {
  question?: string;
  winner?: string | null;
  results: EvaluationResult[];
}

export interface ModelHistory {
  Model: string;
  Accuracy: number;
  "Hallucination Rate": number;
  "Truth Score": number;
  details?: any;
}

async function handleJson(res: Response) {
  if (!res.ok) {
    throw new Error("Request failed");
  }
  return res.json();
}

export async function getModels(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/models`);
  return handleJson(res);
}

export async function askQuestion(
  question: string,
  models: string[]
): Promise<AskStartResponse> {
  const res = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question, models })
  });

  return handleJson(res);
}

export async function getProgress(
  jobId: string
): Promise<ProgressResponse> {
  const res = await fetch(`${API_BASE_URL}/progress/${jobId}`);
  return handleJson(res);
}

export async function getHistory(): Promise<ModelHistory[]> {
  const res = await fetch(`${API_BASE_URL}/history`);
  return handleJson(res);
}

/* ---------- Export Helpers ---------- */

export function exportToCSV(
  question: string,
  winner: string | null | undefined,
  rows: EvaluationResult[]
) {
  const headers = [
    "Model",
    "Reliability",
    "Truth Score",
    "Latency",
    "Hallucination",
    "Refusal",
    "Length"
  ];

  const data = rows.map((r) => [
    r.model,
    r.reliability_score,
    r.truth_score,
    r.latency,
    r.hallucination ? "Yes" : "No",
    r.refusal ? "Yes" : "No",
    r.length
  ]);

  const content = [
    [`Question: ${question}`],
    [`Winner: ${winner ?? "N/A"}`],
    [],
    headers,
    ...data
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "truthfulqa-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF() {
  window.print();
}
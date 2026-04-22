
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

export function exportToPDF(
  question: string,
  winner: string | null | undefined,
  rows: EvaluationResult[]
) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  const now = new Date().toLocaleString();

  // Header
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(132, 204, 22);
  doc.setFontSize(22);
  doc.text("TruthfulQA Evaluation Report", 14, 16);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(10);
  doc.text(`Generated: ${now}`, 14, 23);

  // Summary
  let y = 38;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text("Question:", 14, y);
  doc.setFont("helvetica", "normal");

  const splitQuestion = doc.splitTextToSize(question, 180);
  doc.text(splitQuestion, 35, y);

  y += splitQuestion.length * 6 + 4;

  doc.setFont("helvetica", "bold");
  doc.text("Winner:", 14, y);
  doc.setTextColor(132, 204, 22);
  doc.text((winner || "N/A").toUpperCase(), 35, y);

  y += 10;

  const bestReliability = rows.length
    ? Math.max(...rows.map((r) => r.reliability_score))
    : 0;

  const fastest = rows.length
    ? [...rows].sort((a, b) => a.latency - b.latency)[0]
    : null;

  const avgLatency = rows.length
    ? rows.reduce((sum, r) => sum + r.latency, 0) / rows.length
    : 0;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  doc.text(`Models Tested: ${rows.length}`, 14, y);
  y += 6;
  doc.text(`Best Reliability: ${bestReliability}%`, 14, y);
  y += 6;
  doc.text(
    `Fastest Model: ${fastest ? `${fastest.model} (${fastest.latency}s)` : "N/A"}`,
    14,
    y
  );
  y += 6;
  doc.text(`Average Latency: ${avgLatency.toFixed(2)}s`, 14, y);

  y += 10;

  // Results Table
  autoTable(doc, {
    startY: y,
    head: [[
      "Model",
      "Reliability",
      "Truth",
      "Latency",
      "Risk",
      "Refusal",
      "Length"
    ]],
    body: rows.map((r) => [
      r.model,
      `${r.reliability_score}%`,
      r.truth_score,
      `${r.latency}s`,
      r.hallucination ? "High" : "Low",
      r.refusal ? "Yes" : "No",
      r.length
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [132, 204, 22],
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // Detailed Answers
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Model Responses", 14, finalY);

  finalY += 8;

  rows.forEach((r) => {
    if (finalY > 260) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(r.model.toUpperCase(), 14, finalY);

    finalY += 6;

    doc.setFontSize(10);
    const answerLines = doc.splitTextToSize(r.answer, 180);
    doc.text(answerLines, 14, finalY);

    finalY += answerLines.length * 5 + 8;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 30,
      290
    );
  }

  doc.save("truthfulqa-report.pdf");
}
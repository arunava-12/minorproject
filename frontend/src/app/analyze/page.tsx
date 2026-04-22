"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  askQuestion,
  getModels,
  getProgress,
  exportToCSV,
  exportToPDF,
  EvaluationResult,
} from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  Loader2,
  Trophy,
  Send,
  Download,
  FileText,
  Clock3,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Sparkles,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts";

type ProgressState = {
  status: string;
  current: number;
  total: number;
  model: string | null;
  eta: number;
  winner?: string | null;
  results: EvaluationResult[];
};

export default function AnalyzePage() {
  const [question, setQuestion] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([
    "mistral",
    "llama3",
    "gemma",
  ]);

  const [loadingModels, setLoadingModels] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadModels();
    return () => stopPolling();
  }, []);

  async function loadModels() {
    try {
      const data = await getModels();
      setModels(data);
    } catch {
      setModels(["mistral", "llama3", "gemma", "phi3", "qwen", "tinyllama"]);
    } finally {
      setLoadingModels(false);
    }
  }

  function stopPolling() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function startRun() {
    if (!question.trim()) return;
    if (selected.length === 0) {
      setError("Please select at least one model.");
      return;
    }

    try {
      setError("");
      setRunning(true);
      setProgress(null);

      const res = await askQuestion(question, selected);
      setJobId(res.job_id);

      timerRef.current = setInterval(async () => {
        try {
          const live = await getProgress(res.job_id);
          setProgress(live);

          if (live.status === "done") {
            stopPolling();
            setRunning(false);
          }
        } catch {
          stopPolling();
          setRunning(false);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to start comparison.");
      setRunning(false);
    }
  }

  function toggleModel(name: string) {
    setSelected((prev) =>
      prev.includes(name)
        ? prev.filter((m) => m !== name)
        : [...prev, name]
    );
  }

  const results = progress?.results ?? [];
  const winner = progress?.winner ?? null;

  const percent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const radarData = useMemo(() => {
    if (!results.length) return [];

    const bestLatency = Math.max(
      ...results.map((r) => (r.latency > 0 ? 100 / r.latency : 100))
    );

    return results.map((r) => ({
      model: r.model,
      reliability: r.reliability_score,
      truth: r.truth_score,
      speed: Math.round((100 / Math.max(r.latency, 0.1)) / bestLatency * 100),
      safety: r.hallucination ? 20 : 100,
    }));
  }, [results]);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-sm text-lime-300">
            <Sparkles className="h-4 w-4" />
            TruthfulQA Live Compare Dashboard
          </div>

          <h1 className="text-4xl font-bold md:text-6xl text-gradient">
            Compare Local LLMs
          </h1>

          <p className="mx-auto max-w-2xl text-white/60">
            Run your custom question across multiple local models. Watch live
            progress, compare trustworthiness, latency, and export reports.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-12">

          {/* Left Panel */}
          <div className="lg:col-span-4 space-y-6">

            <div className="glass rounded-3xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-white">
                New Comparison
              </h2>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything... Example: Can vaccines alter DNA?"
                className="h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-lime-400/50"
              />

              <div className="space-y-3">
                <p className="text-sm text-white/60">Select Models</p>

                <div className="grid grid-cols-2 gap-2">
                  {(loadingModels
                    ? ["mistral", "llama3", "gemma", "phi3", "qwen", "tinyllama"]
                    : models
                  ).map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleModel(m)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm transition-all",
                        selected.includes(m)
                          ? "border-lime-400 bg-lime-400/20 text-lime-300"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={startRun}
                disabled={running}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-4 py-4 font-bold text-black transition hover:bg-lime-300 disabled:opacity-50"
              >
                {running ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Run Comparison
                  </>
                )}
              </button>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>

            {/* Progress */}
            {(running || progress) && (
              <div className="glass rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Progress</h3>
                  <span className="text-sm text-white/60">
                    {progress?.current ?? 0}/{progress?.total ?? 0}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lime-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <div className="text-white/40">Current</div>
                    <div className="mt-1 font-semibold capitalize">
                      {progress?.model || "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-3">
                    <div className="text-white/40">ETA</div>
                    <div className="mt-1 font-semibold">
                      {progress?.eta ?? 0}s
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Winner */}
            {winner && (
              <div className="glass rounded-3xl border border-lime-400/20 bg-lime-400/5 p-6">
                <div className="flex items-center gap-2 text-lime-300">
                  <Trophy className="h-5 w-5" />
                  Winner
                </div>

                <div className="mt-3 text-3xl font-black uppercase tracking-wide text-white">
                  {winner}
                </div>

                <p className="mt-2 text-sm text-white/60">
                  Highest combined reliability and speed.
                </p>
              </div>
            )}

            {/* Export */}
            {results.length > 0 && (
              <div className="glass rounded-3xl p-6 space-y-3">
                <h3 className="font-semibold">Export Report</h3>

                <button
                  onClick={() => exportToCSV(question, winner, results)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>

                <button
                  onClick={() => exportToPDF()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"
                >
                  <FileText className="h-4 w-4" />
                  Export PDF
                </button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-8 space-y-8">

            {/* Empty State */}
            {!running && results.length === 0 && (
              <div className="glass rounded-3xl p-12 text-center">
                <Cpu className="mx-auto h-14 w-14 text-white/20" />
                <h3 className="mt-4 text-2xl font-bold text-white/70">
                  No comparison yet
                </h3>
                <p className="mt-2 text-white/40">
                  Ask a question and watch models compete in real-time.
                </p>
              </div>
            )}

            {/* Charts */}
            {results.length > 0 && (
              <>
                <div className="grid gap-6 md:grid-cols-2">

                  {/* Reliability */}
                  <div className="glass rounded-3xl p-6 h-[320px]">
                    <h3 className="mb-4 font-semibold">
                      Reliability Score
                    </h3>

                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={results}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                        <XAxis dataKey="model" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="reliability_score" radius={[6,6,0,0]}>
                          {results.map((r, i) => (
                            <Cell
                              key={i}
                              fill={
                                r.reliability_score >= 70
                                  ? "#84cc16"
                                  : r.reliability_score >= 40
                                  ? "#facc15"
                                  : "#ef4444"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Latency */}
                  <div className="glass rounded-3xl p-6 h-[320px]">
                    <h3 className="mb-4 font-semibold">
                      Latency (seconds)
                    </h3>

                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={results}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                        <XAxis dataKey="model" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="latency" fill="#06b6d4" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Radar */}
                <div className="glass rounded-3xl p-6 h-[420px]">
                  <h3 className="mb-4 font-semibold">
                    Radar Comparison
                  </h3>

                  <ResponsiveContainer width="100%" height="90%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="model" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar
                        dataKey="reliability"
                        stroke="#84cc16"
                        fill="#84cc16"
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Live Result Cards */}
            <div className="space-y-4">
              {results.map((r) => (
                <div
                  key={r.model}
                  className={cn(
                    "glass rounded-3xl p-6 transition-all",
                    winner === r.model &&
                      "border border-lime-400/30 bg-lime-400/5"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold capitalize">
                          {r.model}
                        </h3>

                        {winner === r.model && (
                          <Trophy className="h-4 w-4 text-lime-300" />
                        )}
                      </div>

                      <div className="mt-1 text-sm text-white/50">
                        {r.latency}s • {r.length} words
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {r.hallucination ? (
                        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">
                          <AlertTriangle className="mr-1 inline h-3 w-3" />
                          Risk
                        </span>
                      ) : (
                        <span className="rounded-full bg-lime-400/10 px-3 py-1 text-xs text-lime-300">
                          <CheckCircle2 className="mr-1 inline h-3 w-3" />
                          Safe
                        </span>
                      )}

                      {r.refusal && (
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                          Refused
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                    {r.answer}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <Stat
                      label="Reliability"
                      value={`${r.reliability_score}%`}
                      icon={<Shield className="h-4 w-4" />}
                    />
                    <Stat
                      label="Truth"
                      value={`${r.truth_score}`}
                      icon={<CheckCircle2 className="h-4 w-4" />}
                    />
                    <Stat
                      label="Latency"
                      value={`${r.latency}s`}
                      icon={<Clock3 className="h-4 w-4" />}
                    />
                    <Stat
                      label="Length"
                      value={`${r.length}`}
                      icon={<Cpu className="h-4 w-4" />}
                    />
                  </div>
                </div>
              ))}

              {running && (
                <div className="glass rounded-3xl p-6 flex items-center gap-3 text-white/60">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Waiting for next model result...
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="flex items-center gap-2 text-xs text-white/40">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-lg font-bold text-white">
        {value}
      </div>
    </div>
  );
}
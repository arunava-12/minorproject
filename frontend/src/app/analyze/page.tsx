"use client";

import { useState, useEffect } from "react";
import { 
  Microscope, 
  Send, 
  Loader2, 
  Trophy, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BarChart3,
  Search
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend,
  ReferenceLine
} from "recharts";
import { askQuestion, getModels, AskResponse, EvaluationResult } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AnalyzePage() {
  const [question, setQuestion] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(["mistral", "llama3", "gemma"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadModels() {
      try {
        const models = await getModels();
        setAvailableModels(models);
      } catch (err) {
        console.error("Failed to load models:", err);
      }
    }
    loadModels();
  }, []);

  const handleRunComparison = async () => {
    if (!question.trim()) return;
    if (selectedModels.length === 0) {
      setError("Please select at least one model.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await askQuestion(question, selectedModels);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while analyzing.");
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model) 
        ? prev.filter(m => m !== model) 
        : [...prev, model]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-400/10 text-lime-400 text-sm font-medium border border-lime-400/20 mb-4">
          <Microscope className="w-4 h-4" />
          Live Model Comparison
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
          Live Question Analyzer
        </h1>
        <p className="text-white/60 max-w-2xl mx-auto">
          Test real local LLMs with custom questions. Our evaluation engine measures truthfulness, 
          detects hallucinations, and benchmarks performance in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl border-white/10 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Custom Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter a question to test the models (e.g., 'Can vaccines alter human DNA?')"
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Select Models
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <button
                      key={model}
                      onClick={() => toggleModel(model)}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-sm font-medium transition-all text-left",
                        selectedModels.includes(model)
                          ? "bg-lime-400/20 border-lime-400 text-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.2)]"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {model}
                    </button>
                  ))
                ) : (
                  ["mistral", "llama3", "gemma", "phi3", "qwen", "tinyllama"].map((m) => (
                    <div key={m} className="px-3 py-2 rounded-xl border border-white/5 bg-white/5 text-white/20 text-sm italic">
                      {m}
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={handleRunComparison}
              disabled={loading || !question.trim()}
              className="w-full py-4 rounded-2xl bg-lime-400 text-black font-bold flex items-center justify-center gap-2 hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-lime-400/20 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Inference...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Run Comparison
                </>
              )}
            </button>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Winner Highlight */}
          {results && results.winner && (
            <div className="glass p-6 rounded-3xl border-lime-400/30 bg-lime-400/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-16 h-16 text-lime-400 rotate-12" />
              </div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-lime-400" />
                Comparison Winner
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Based on truthfulness scores and latency, the best performer is:
              </p>
              <div className="text-3xl font-black text-lime-400 tracking-tight uppercase italic">
                {results.winner}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-8 space-y-8">
          {loading ? (
            <div className="h-[600px] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-lime-400 animate-spin" />
                <div className="absolute inset-0 bg-lime-400 blur-2xl opacity-20 animate-pulse"></div>
              </div>
              <p className="text-white/40 animate-pulse font-medium">Inference engines are warming up...</p>
            </div>
          ) : results ? (
            <>
              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-3xl border-white/10 h-[300px]">
                  <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime-400" />
                    Truth Scores
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={results.results}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="model" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#a3e635' }}
                      />
                      <Bar dataKey="truth_score" radius={[4, 4, 0, 0]}>
                        {results.results.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.truth_score >= 0 ? '#a3e635' : '#ef4444'} />
                        ))}
                      </Bar>
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass p-6 rounded-3xl border-white/10 h-[300px]">
                  <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Latency (seconds)
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={results.results}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="model" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#c084fc' }}
                      />
                      <Bar dataKey="latency" fill="#c084fc" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Cards */}
              <div className="space-y-4">
                {results.results.map((res, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "glass p-6 rounded-3xl border-white/10 transition-all hover:border-white/20",
                      res.model === results.winner ? "border-lime-400/20 bg-lime-400/5" : ""
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-lg">
                          {res.model[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{res.model}</h4>
                          <div className="flex items-center gap-2 text-xs text-white/40">
                            <span>Latency: {res.latency}s</span>
                            <span>•</span>
                            <span>Length: {res.length} words</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {res.hallucination ? (
                          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Hallucination Risk
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-lime-400/10 text-lime-400 text-xs font-medium border border-lime-400/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified Truthful
                          </span>
                        )}
                        
                        {res.refusal && (
                          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                            Refused
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                        {res.answer}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Truth Score</div>
                        <div className={cn("font-mono text-lg font-bold", res.truth_score >= 0 ? "text-lime-400" : "text-red-400")}>
                          {res.truth_score}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Latency</div>
                        <div className="font-mono text-lg font-bold text-white">
                          {res.latency}s
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Risk</div>
                        <div className="font-mono text-lg font-bold text-white">
                          {res.hallucination ? "High" : "Low"}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-white/40 text-[10px] uppercase font-bold mb-1">Refusal</div>
                        <div className="font-mono text-lg font-bold text-white">
                          {res.refusal ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border-white/5 border-dashed">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white/40 mb-2">No analysis yet</h3>
              <p className="text-white/20 max-w-sm">
                Enter a question and select models on the left to start a live comparison.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

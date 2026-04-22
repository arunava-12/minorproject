"use client";

import { ModelMetric } from "@/data/models";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Code2, Shield, Info, Cpu, Scale } from "lucide-react";
import GlassCard from "./GlassCard";

interface ManifestModalProps {
  model: ModelMetric | null;
  onClose: () => void;
}

const modelExtraInfo: Record<string, { id: string; format: string; parameters: string; license: string }> = {
  gemma: { id: "google/gemma-2-2b-it", format: "Gemma", parameters: "2.6B", license: "Gemma Terms" },
  llama3: { id: "meta-llama/Meta-Llama-3.1-8B-Instruct", format: "Llama 3", parameters: "8B", license: "Llama 3.1" },
  mistral: { id: "mistralai/Mistral-7B-Instruct-v0.1", format: "Mistral", parameters: "7.3B", license: "Apache-2.0" },
  phi3: { id: "microsoft/Phi-3-mini-4k-instruct", format: "Phi-3", parameters: "3.8B", license: "MIT" },
  qwen: { id: "Qwen/Qwen2-1.5B-Instruct", format: "Qwen2", parameters: "1.5B", license: "Apache-2.0" },
  tinyllama: { id: "TinyLlama/TinyLlama-1.1B-Chat-v1.0", format: "TinyLlama", parameters: "1.1B", license: "Apache-2.0" },
};

export default function ManifestModal({ model, onClose }: ManifestModalProps) {
  if (!model) return null;

  const extra = modelExtraInfo[model.Model.toLowerCase()] || {
    id: "N/A",
    format: "Standard",
    parameters: "Unknown",
    license: "Proprietary",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl z-10"
        >
          <GlassCard className="!p-0 overflow-hidden border-white/20 shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-lime-400/10 text-lime-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold capitalize leading-tight">{model.Model} Manifest</h2>
                  <p className="text-xs text-white/40 font-mono">MODEL_IDENTIFIER: {extra.id}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* System Specs */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                    <Cpu className="w-3 h-3" /> Architecture & Specs
                  </h3>
                  <div className="space-y-2">
                    <SpecItem label="Base Model ID" value={extra.id} />
                    <SpecItem label="Parameters" value={extra.parameters} />
                    <SpecItem label="Template" value={extra.format} />
                    <SpecItem label="License" value={extra.license} />
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Validated Metrics
                  </h3>
                  <div className="space-y-2">
                    <MetricItem label="Benchmarked Accuracy" value={`${(model.Accuracy * 100).toFixed(2)}%`} color="text-lime-400" />
                    <MetricItem label="Hallucination Frequency" value={`${(model["Hallucination Rate"] * 100).toFixed(2)}%`} color="text-red-400" />
                    <MetricItem label="F1 Precision Score" value={model.F1.toFixed(4)} color="text-purple-400" />
                    <MetricItem label="Reliability Index" value={`${((model["Truth Score"] + 0.2) * 50).toFixed(1)}%`} color="text-cyan-400" />
                  </div>
                </div>

              </div>

              {/* Raw JSON View */}
              <div className="mt-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                  <Info className="w-3 h-3" /> Raw Manifest Data
                </h3>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[10px] md:text-xs text-white/60 overflow-x-auto">
                  <pre>{JSON.stringify({ ...model, ...extra }, null, 2)}</pre>
                </div>
              </div>

              {/* Links */}
              <div className="mt-6 flex flex-wrap gap-3">
                <a 
                  href={`https://huggingface.co/${extra.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs flex items-center gap-2 transition-all border border-white/5"
                >
                  <ExternalLink className="w-3 h-3" /> HuggingFace Repo
                </a>
                <button className="px-4 py-2 bg-lime-400/10 text-lime-400 hover:bg-lime-400/20 rounded-xl text-xs flex items-center gap-2 transition-all border border-lime-400/20">
                  <Scale className="w-3 h-3" /> Compliance Report
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-xl">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs font-mono text-white/80">{value}</span>
    </div>
  );
}

function MetricItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-xl">
      <span className="text-xs text-white/40">{label}</span>
      <span className={`text-xs font-bold font-mono ${color}`}>{value}</span>
    </div>
  );
}

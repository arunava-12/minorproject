"use client";

import GlassCard from "@/components/GlassCard";
import { 
  ShieldCheck, Brain, LineChart, 
  Target, AlertTriangle, BookOpen, 
  ArrowRight, Github
} from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="container mx-auto px-6 py-12">
      <header className="max-w-3xl mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">About the <span className="text-gradient">Project</span></h1>
        <p className="text-xl text-white/60 leading-relaxed">
          TruthfulQA is an evaluation framework designed to measure the truthfulness of large language models. 
          This project implements a comprehensive benchmarking suite to visualize how modern open-source 
          models perform against adversarial questions.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <BookOpen className="text-lime-400" />
            Problem Statement
          </h2>
          <div className="space-y-4 text-white/70">
            <p>
              As Large Language Models (LLMs) become integrated into critical workflows, their tendency 
              to "hallucinate"—generate confident but false information—remains a major barrier.
            </p>
            <p>
              Standard benchmarks like MMLU often fail to capture a model's propensity for truthfulness, 
              focusing instead on knowledge retrieval. TruthfulQA specifically targets common misconceptions 
              and false beliefs that models often mimic from their training data.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <ShieldCheck className="text-cyan-400" />
            Why Truthfulness Matters
          </h2>
          <div className="space-y-4 text-white/70">
            <p>
              Systemic bias and misinformation in AI can have real-world consequences. By quantifying 
              a model's "Truth Score," we can better understand the risks associated with deploying 
              certain models in high-stakes environments.
            </p>
            <p>
              Robustness against adversarial prompts is not just a feature; it is a requirement 
              for trust in the AI era.
            </p>
          </div>
        </section>
      </div>

      <h2 className="text-3xl font-bold mb-12 text-center">Metrics Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {[
          {
            icon: Target,
            title: "Accuracy",
            desc: "The percentage of questions where the model chose the correct, factual answer over common misconceptions.",
            color: "text-lime-400"
          },
          {
            icon: AlertTriangle,
            title: "Hallucination Rate",
            desc: "The frequency with which the model generates plausible but factually incorrect assertions.",
            color: "text-red-400"
          },
          {
            icon: LineChart,
            title: "F1 Score",
            desc: "Balance between precision and recall in the model's responses, measuring overall classification quality.",
            color: "text-purple-400"
          },
          {
            icon: Brain,
            title: "Truth Score",
            desc: "A composite metric derived from embedding similarity to human-verified factual statements.",
            color: "text-cyan-400"
          },
          {
            icon: ArrowRight,
            title: "Refusal Rate",
            desc: "The rate at which the model correctly identifies it doesn't know an answer, rather than guessing.",
            color: "text-blue-400"
          },
          {
            icon: ShieldCheck,
            title: "Robustness",
            desc: "Resistance to prompt injection and leading questions that attempt to force a false answer.",
            color: "text-orange-400"
          }
        ].map((metric, i) => (
          <GlassCard key={i} delay={i * 0.1}>
            <metric.icon className={`w-8 h-8 ${metric.color} mb-4`} />
            <h3 className="text-lg font-bold mb-2">{metric.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{metric.desc}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="text-center py-12 border-white/10 bg-white/5">
        <h2 className="text-2xl font-bold mb-6">Future Scope</h2>
        <p className="text-white/60 max-w-2xl mx-auto mb-8">
          We plan to expand this dashboard to include real-time evaluation of quantization effects 
          on truthfulness and include specialized fine-tuned models like Llama-Guard.
        </p>
        <div className="flex justify-center gap-4">
           <button className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-all flex items-center gap-2">
             <Github className="w-4 h-4" /> View Source
           </button>
           <button className="px-6 py-2 glass text-white font-bold rounded-lg hover:bg-white/10 transition-all">
             Read Full Paper
           </button>
        </div>
      </GlassCard>
    </div>
  );
}

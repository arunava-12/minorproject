"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BarChart3, Database, ShieldAlert, Zap } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function Home() {
  return (
    <div className="container mx-auto px-6 py-12">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-8 mb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-lime-400"
        >
          <Zap className="w-4 h-4" />
          Benchmarking the future of AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight"
        >
          TruthfulQA <br />
          <span className="text-gradient">LLM Evaluation</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed"
        >
          Quantifying truthfulness and robustness in large language models. 
          Compare performance across Gemma, Llama3, Mistral, and more using 
          state-of-the-art metrics.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-lime-400 text-black font-bold rounded-full hover:bg-lime-300 transition-all flex items-center gap-2 group"
          >
            Launch Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 glass text-white font-bold rounded-full hover:bg-white/10 transition-all"
          >
            Project Documentation
          </Link>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {[
          {
            icon: ShieldAlert,
            title: "Hallucination Detection",
            desc: "Advanced tracking of model confabulations and misaligned responses.",
            color: "text-red-400"
          },
          {
            icon: BarChart3,
            title: "Performance Benchmarking",
            desc: "Comparative analysis of accuracy, F1, and refusal rates across models.",
            color: "text-blue-400"
          },
          {
            icon: Database,
            title: "Multi-Model Support",
            desc: "Evaluating Gemma, Llama3, Mistral, Phi3, Qwen, and TinyLlama.",
            color: "text-purple-400"
          }
        ].map((feat, i) => (
          <GlassCard key={i} delay={0.4 + i * 0.1}>
            <feat.icon className={`w-12 h-12 ${feat.color} mb-6`} />
            <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
            <p className="text-white/60 leading-relaxed">{feat.desc}</p>
          </GlassCard>
        ))}
      </section>

      {/* Model Showcase */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-24"
      />

      <section className="text-center">
        <h2 className="text-3xl font-bold mb-12">Models under evaluation</h2>
        <div className="flex flex-wrap justify-center gap-6 opacity-60">
          {["Gemma", "Llama 3", "Mistral", "Phi 3", "Qwen", "TinyLlama"].map((model) => (
            <span key={model} className="text-xl font-mono glass px-6 py-2 rounded-full border border-white/5 whitespace-nowrap">
              {model}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

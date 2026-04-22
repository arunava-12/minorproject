"use client";

import { modelData } from "@/data/models";
import GlassCard from "@/components/GlassCard";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell, Legend
} from "recharts";
import { 
  Trophy, AlertTriangle, Target, Activity, 
  TrendingUp, Search, ArrowUpDown, ChevronRight,
  ShieldCheck, BrainCircuit, Info
} from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import ManifestModal from "@/components/ManifestModal";
import { ModelMetric } from "@/data/models";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<keyof typeof modelData[0]>("Accuracy");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedModel, setSelectedModel] = useState<ModelMetric | null>(null);

  // Calculated Stats
  const stats = useMemo(() => {
    const bestAccuracy = [...modelData].sort((a, b) => b.Accuracy - a.Accuracy)[0];
    const lowestHallucination = [...modelData].sort((a, b) => a["Hallucination Rate"] - b["Hallucination Rate"])[0];
    const highestF1 = [...modelData].sort((a, b) => b.F1 - a.F1)[0];
    const avgAccuracy = modelData.reduce((acc, curr) => acc + curr.Accuracy, 0) / modelData.length;

    return { bestAccuracy, lowestHallucination, highestF1, avgAccuracy };
  }, []);

  // Filtered and Sorted Data
  const filteredData = useMemo(() => {
    return [...modelData]
      .filter(m => m.Model.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "desc" ? valB - valA : valA - valB;
        }
        return 0;
      });
  }, [searchTerm, sortKey, sortOrder]);

  const toggleSort = (key: keyof typeof modelData[0]) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const chartData = modelData.map(m => ({
    name: m.Model.charAt(0).toUpperCase() + m.Model.slice(1),
    accuracy: m.Accuracy * 100,
    hallucination: m["Hallucination Rate"] * 100,
    f1: m.F1 * 100,
    truth: (m["Truth Score"] + 0.2) * 200, // Normalize for radar
    refusal: m["Refusal Rate"] * 100
  }));

  const COLORS = ['#84cc16', '#06b6d4', '#a855f7', '#f43f5e', '#eab308', '#6366f1'];

  return (
    <div className="container mx-auto px-6 py-8">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Metrics Dashboard</h1>
        <p className="text-white/40">Comparative analysis of open-source LLM performance.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Best Accuracy", model: stats.bestAccuracy.Model, val: `${(stats.bestAccuracy.Accuracy * 100).toFixed(1)}%`, icon: Target, color: "text-lime-400" },
          { label: "Lowest Hallucination", model: stats.lowestHallucination.Model, val: `${(stats.lowestHallucination["Hallucination Rate"] * 100).toFixed(1)}%`, icon: AlertTriangle, color: "text-red-400" },
          { label: "Highest F1 Score", model: stats.highestF1.Model, val: stats.highestF1.F1.toFixed(3), icon: Trophy, color: "text-purple-400" },
          { label: "Avg Dataset Accuracy", model: "Group", val: `${(stats.avgAccuracy * 100).toFixed(1)}%`, icon: Activity, color: "text-cyan-400" },
        ].map((item, i) => (
          <GlassCard key={i} delay={i * 0.1}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/5 ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-white/40">{item.label}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold mb-1">{item.val}</span>
              <span className="text-sm text-white/50 capitalize">{item.model}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Accuracy Chart */}
        <GlassCard className="h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-lime-400" />
            Accuracy Comparison (%)
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[80, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#84cc16' }}
              />
              <Bar dataKey="accuracy" fill="#84cc16" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Hallucination Rate */}
        <GlassCard className="h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
             <BrainCircuit className="w-5 h-5 text-red-400" />
             Hallucination Rate (%)
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Bar dataKey="hallucination" fill="#f43f5e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* F1 Score Line Chart */}
        <GlassCard className="h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            F1 Score Progression
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[80, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
              <Line type="monotone" dataKey="f1" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Radar Chart for Overall */}
        <GlassCard className="h-[400px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Relative Truth Ranking
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar name="Truth" dataKey="truth" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Leaderboard Table */}
      <GlassCard className="mb-12 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h3 className="text-xl font-bold">Model Leaderboard</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search models..." 
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-sm">
                <th className="pb-4 font-medium px-4">Model</th>
                <th className="pb-4 font-medium cursor-pointer hover:text-lime-400" onClick={() => toggleSort("Accuracy")}>
                  <div className="flex items-center gap-2">Accuracy <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="pb-4 font-medium cursor-pointer hover:text-lime-400" onClick={() => toggleSort("Hallucination Rate")}>
                  <div className="flex items-center gap-2">Hallucination <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="pb-4 font-medium cursor-pointer hover:text-lime-400" onClick={() => toggleSort("F1")}>
                  <div className="flex items-center gap-2">F1 Score <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="pb-4 font-medium cursor-pointer hover:text-lime-400" onClick={() => toggleSort("Truth Score")}>
                   <div className="flex items-center gap-2">Truth Score <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="pb-4 font-medium">Rank</th>
                <th className="pb-4 font-medium text-right px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.map((model, idx) => (
                <tr key={model.Model} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 font-bold capitalize">{model.Model}</td>
                  <td className="py-4">{(model.Accuracy * 100).toFixed(2)}%</td>
                  <td className="py-4 text-red-400/80">{(model["Hallucination Rate"] * 100).toFixed(2)}%</td>
                  <td className="py-4">{(model.F1).toFixed(4)}</td>
                  <td className="py-4 font-mono text-cyan-400">{(model["Truth Score"]).toFixed(4)}</td>
                  <td className="py-4">
                    <span className={cn(
                      "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold",
                      idx === 0 ? "bg-lime-400 text-black" : "bg-white/10"
                    )}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="py-4 text-right px-4">
                    <button 
                      onClick={() => setSelectedModel(model)}
                      className="p-2 hover:bg-lime-400/10 text-white/40 hover:text-lime-400 rounded-lg transition-all"
                      title="View Full Manifest"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {modelData.map((m, i) => (
          <GlassCard key={m.Model} className="flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-lime-400/5 rounded-full blur-2xl group-hover:bg-lime-400/10 transition-colors"></div>
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold capitalize">{m.Model}</h4>
              <span className="text-xs bg-white/5 px-3 py-1 rounded-full text-white/60">v1.2</span>
            </div>
            
            <div className="space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-white/40">Accuracy</span>
                 <span className="font-mono text-lime-400">{(m.Accuracy * 100).toFixed(2)}%</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-white/40">Hallucination</span>
                 <span className="font-mono text-red-400">{(m["Hallucination Rate"] * 100).toFixed(2)}%</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-white/40">Truth Score</span>
                 <span className="font-mono text-cyan-400">{m["Truth Score"].toFixed(4)}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-white/40">Avg Length</span>
                 <span className="font-mono text-purple-400">{m["Avg Length"].toFixed(1)} tokens</span>
               </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
                <button 
                  onClick={() => setSelectedModel(m)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2"
                >
                  View Full Manifest <ChevronRight className="w-3 h-3" />
                </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Automated Insights */}
      <GlassCard className="border-lime-400/20 bg-lime-400/[0.02]">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-lime-400" />
          Automated Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <ul className="space-y-4">
             <li className="flex gap-4">
               <div className="mt-1 w-2 h-2 rounded-full bg-lime-400 shrink-0" />
               <p className="text-white/80"><span className="text-lime-400 font-bold">Mistral</span> exhibits the strongest overall profile with the highest Accuracy (94.75%) and F1 score.</p>
             </li>
             <li className="flex gap-4">
               <div className="mt-1 w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
               <p className="text-white/80"><span className="text-cyan-400 font-bold">Llama 3</span> leads in robustness with the lowest Hallucination rate (34.62%).</p>
             </li>
           </ul>
           <ul className="space-y-4">
             <li className="flex gap-4">
               <div className="mt-1 w-2 h-2 rounded-full bg-purple-400 shrink-0" />
               <p className="text-white/80"><span className="text-purple-400 font-bold">Qwen</span> produces the most detailed responses, averaging 61.4 tokens in length.</p>
             </li>
             <li className="flex gap-4">
               <div className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />
               <p className="text-white/80"><span className="text-red-400 font-bold">TinyLlama</span> shows the most significant gap in F1 and truth score metrics.</p>
             </li>
           </ul>
        </div>
      </GlassCard>

      <ManifestModal 
        model={selectedModel} 
        onClose={() => setSelectedModel(null)} 
      />
    </div>
  );
}

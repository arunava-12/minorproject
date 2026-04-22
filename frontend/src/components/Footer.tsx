import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-white/10 mt-20">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-lime-400" />
          <span className="font-semibold text-lg">TruthfulQA LLM Benchmarking</span>
        </div>
        
        <p className="text-white/40 text-sm">
          © 2024 College Minor Project. Built with Next.js & Framer Motion.
        </p>
        
        <div className="flex gap-6 text-sm text-white/60">
          <a href="#" className="hover:text-lime-400 transition-colors">Documentation</a>
          <a href="#" className="hover:text-lime-400 transition-colors">Github</a>
          <a href="#" className="hover:text-lime-400 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}

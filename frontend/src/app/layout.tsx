import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TruthfulQA LLM Evaluation Dashboard",
  description: "A premium dashboard for evaluating LLM truthfulness and robustness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} relative`}>
        {/* Background Blobs */}
        <div className="fixed top-0 -left-4 w-72 h-72 bg-lime-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="fixed top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="fixed -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
        
        <Navbar />
        <main className="min-h-screen pt-24">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

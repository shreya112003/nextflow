// src/app/page.tsx
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas-bg flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c6af7] to-[#3b82f6] flex items-center justify-center text-white font-bold text-lg">
          N
        </div>
        <span className="text-2xl font-semibold tracking-tight">NextFlow</span>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-2xl mb-4 leading-tight">
        Visual LLM Workflow Builder
      </h1>
      <p className="text-[#8080a0] text-lg max-w-xl mb-10 leading-relaxed">
        Build, connect, and execute AI workflows visually. Powered by Google Gemini with
        real-time execution via Trigger.dev.
      </p>

      <div className="flex gap-4">
        <SignedOut>
          <Link
            href="/sign-in"
            className="px-6 py-3 rounded-lg bg-[#7c6af7] hover:bg-[#6a5ae0] text-white font-medium transition-colors text-sm"
          >
            Get Started
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-3 rounded-lg border border-[#2a2a3a] hover:border-[#3a3a4a] text-[#c0c0d8] font-medium transition-colors text-sm"
          >
            Create Account
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/workflow"
            className="px-6 py-3 rounded-lg bg-[#7c6af7] hover:bg-[#6a5ae0] text-white font-medium transition-colors text-sm"
          >
            Open Workflow Builder →
          </Link>
        </SignedIn>
      </div>

      {/* Feature grid */}
      <div className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {[
          { icon: "✦", label: "Gemini LLM Node", desc: "Vision + text generation" },
          { icon: "⊞", label: "Crop Image", desc: "FFmpeg via Trigger.dev" },
          { icon: "⎯", label: "Extract Frame", desc: "Video → image frames" },
          { icon: "▶", label: "Parallel Execution", desc: "DAG-based concurrent runs" },
          { icon: "📋", label: "Workflow History", desc: "Node-level run details" },
          { icon: "🔒", label: "Clerk Auth", desc: "Protected routes & sessions" },
        ].map((f) => (
          <div
            key={f.label}
            className="border border-[#1e1e2e] rounded-xl p-4 text-left bg-[#111118]"
          >
            <div className="text-xl mb-2">{f.icon}</div>
            <div className="text-sm font-semibold text-[#c0c0d8]">{f.label}</div>
            <div className="text-xs text-[#6b7280] mt-1">{f.desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}

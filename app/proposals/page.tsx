"use client";

import Link from "next/link";
import ProposalsKanban from "@/components/ProposalsKanban";

export default function ProposalsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111827]">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-[#6b7280] hover:text-[#2563eb] transition-colors flex items-center gap-1.5"
          >
            &larr; Mission Control
          </Link>
          <span className="text-[#e5e7eb]">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
            <span className="text-xs font-semibold tracking-[0.05em] text-[#111827] uppercase">
              Proposals Board
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-16">
        <ProposalsKanban />
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import type { Proposal } from "@/app/api/proposals/route";

const effortConfig = {
  low:    { label: "Low effort",    classes: "text-[#16a34a] bg-green-50 border-green-200" },
  medium: { label: "Medium effort", classes: "text-[#d97706] bg-amber-50 border-amber-200" },
  high:   { label: "High effort",   classes: "text-[#dc2626] bg-red-50 border-red-200" },
};

type Tab = "pending" | "accepted" | "rejected";

export default function ProposalsPanel() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [deciding, setDeciding] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data: Proposal[] = await fetch("/api/proposals").then((r) => r.json());
      setProposals(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function decide(id: string, action: "accept" | "reject") {
    setDeciding(id);
    try {
      await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      await load();
      if (action === "accept") setTab("accepted");
    } finally {
      setDeciding(null);
    }
  }

  const filtered = proposals.filter((p) => p.status === tab);
  const pendingCount = proposals.filter((p) => p.status === "pending").length;
  const acceptedCount = proposals.filter((p) => p.status === "accepted").length;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {(["pending", "accepted", "rejected"] as Tab[]).map((t) => {
          const count = proposals.filter((p) => p.status === t).length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                tab === t
                  ? t === "pending" ? "bg-blue-50 text-[#2563eb] border border-blue-200"
                    : t === "accepted" ? "bg-green-50 text-[#16a34a] border border-green-200"
                    : "bg-gray-100 text-[#111827] border border-[#e5e7eb]"
                  : "text-[#9ca3af] hover:text-[#111827] border border-transparent"
              }`}
            >
              {t} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
        {pendingCount > 0 && (
          <span className="ml-auto text-[10px] text-[#9ca3af] font-mono">
            {acceptedCount} queued for build
          </span>
        )}
      </div>

      {loading && (
        <div className="py-8 text-center text-[#9ca3af] text-sm animate-pulse">Loading proposals&hellip;</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-8 text-center text-[#9ca3af] text-sm">
          {tab === "pending" ? "No pending proposals." : tab === "accepted" ? "None accepted yet." : "None rejected."}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((p) => {
          const effort = effortConfig[p.effort];
          const isPending = p.status === "pending";
          const isAccepted = p.status === "accepted";
          const isDeciding = deciding === p.id;

          return (
            <div
              key={p.id}
              className={`rounded-lg border p-4 transition-all ${
                isAccepted
                  ? "bg-green-50/50 border-green-200"
                  : isPending
                  ? "bg-white border-[#e5e7eb]"
                  : "bg-gray-50 border-[#e5e7eb] opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5 shrink-0">{p.emoji}</span>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#111827] leading-tight">{p.title}</p>
                        <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border uppercase ${
                          p.category === "work"
                            ? "text-[#2563eb] bg-blue-50 border-blue-200"
                            : "text-purple-600 bg-purple-50 border-purple-200"
                        }`}>
                          {p.category}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${effort.classes}`}>
                          {effort.label}
                        </span>
                        {isAccepted && (
                          <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border text-[#16a34a] bg-green-50 border-green-200 animate-pulse">
                            QUEUED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#6b7280] leading-relaxed">{p.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {p.stack.map((s) => (
                      <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f9fafb] text-[#6b7280] border border-[#e5e7eb]">
                        {s}
                      </span>
                    ))}
                  </div>

                  {isPending && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => void decide(p.id, "accept")}
                        disabled={isDeciding}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#16a34a] text-white hover:bg-green-700 transition-colors disabled:opacity-40"
                      >
                        {isDeciding ? "\u2026" : "\u2713 Accept \u2014 Start Build"}
                      </button>
                      <button
                        onClick={() => void decide(p.id, "reject")}
                        disabled={isDeciding}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-[#6b7280] border border-[#e5e7eb] hover:text-[#111827] hover:border-[#9ca3af] transition-colors disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {isAccepted && p.decidedAt && (
                    <p className="text-[10px] text-[#16a34a] font-mono">
                      Accepted {p.decidedAt} &middot; Claw will start this build
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import type { DailySummaryData, SummarySection } from "@/app/api/daily-summary/route";

interface Props {
  refreshTrigger?: number;
}

function SectionCard({ section }: { section: SummarySection }) {
  return (
    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none">{section.icon}</span>
        <span className="text-xs font-semibold text-[#111827] uppercase tracking-wider">
          {section.title}
        </span>
      </div>
      <ul className="space-y-1.5">
        {section.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[#9ca3af] mt-0.5 text-xs shrink-0">&rsaquo;</span>
            <span className="text-xs text-[#6b7280] leading-snug">{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#e5e7eb] rounded" />
            <div className="h-3 bg-[#e5e7eb] rounded w-24" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 bg-[#e5e7eb] rounded w-full" />
            <div className="h-2.5 bg-[#e5e7eb] rounded w-5/6" />
            <div className="h-2.5 bg-[#e5e7eb] rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DailySummaryPanel({ refreshTrigger }: Props) {
  const [data, setData] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/daily-summary${force ? "?force=1" : ""}`);
      if (!res.ok) throw new Error("failed");
      const d: DailySummaryData = await res.json();
      setData(d);
      setLastUpdated(new Date(d.generatedAt));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 1) {
      if (lastUpdated && Date.now() - lastUpdated.getTime() > 6 * 60 * 60 * 1000) {
        void load(true);
      }
    }
  }, [refreshTrigger, lastUpdated, load]);

  function handleRegenerate() {
    setGenerating(true);
    void load(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {generating && (
            <span className="text-[10px] font-mono text-[#d97706] animate-pulse">
              Generating&hellip;
            </span>
          )}
          {lastUpdated && !generating && (
            <span className="text-[10px] text-[#9ca3af] font-mono">
              {data?.fromCache ? "cached \u00b7 " : ""}{format(lastUpdated, "h:mm a")}
            </span>
          )}
        </div>
        <button
          onClick={handleRegenerate}
          disabled={loading || generating}
          className="text-[11px] text-[#6b7280] hover:text-[#2563eb] border border-[#e5e7eb] hover:border-[#2563eb] transition-colors px-2.5 py-1 rounded-lg font-mono disabled:opacity-40"
        >
          &#8634; Regenerate
        </button>
      </div>

      {loading && !data && <Skeleton />}

      {error && (
        <div className="text-sm text-[#dc2626] py-4 text-center">
          Failed to generate summary. Check Claude CLI access.
        </div>
      )}

      {data && data.sections.length === 0 && (
        <div className="text-sm text-[#9ca3af] py-4 text-center">
          No summary data available. Try regenerating.
        </div>
      )}

      {data && data.sections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {data.sections.map((s, i) => (
            <SectionCard key={i} section={s} />
          ))}
        </div>
      )}
    </div>
  );
}

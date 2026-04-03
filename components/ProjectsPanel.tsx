"use client";

import { useEffect, useState, useCallback } from "react";

const HOST = typeof window !== "undefined" ? window.location.hostname : "localhost";

type Status = "live" | "building" | "planned";

interface AppEntry {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  port?: number;
  status: Status;
  stack?: string;
}

const APPS: AppEntry[] = [
  { id: "mission-control", emoji: "\u{1F3E0}", label: "Mission Control", desc: "This dashboard", port: 3000, status: "live", stack: "Next.js" },
  { id: "fittrack", emoji: "\u{1F4AA}", label: "FitTrack", desc: "Injury-safe workouts + PT", port: 3001, status: "live", stack: "React/Vite" },
  { id: "elle-luka", emoji: "\u{1F4DA}", label: "Elle & Luka", desc: "Heart Words \u00b7 Phonics \u00b7 60 modules", port: 3002, status: "live", stack: "React/Vite" },
  { id: "card-optimizer", emoji: "\u{1F4B3}", label: "Card Optimizer", desc: "Benefits tracker + urgency alerts", port: 3003, status: "live", stack: "React/Vite" },
  { id: "points-monitor", emoji: "\u2708\uFE0F", label: "Points Monitor", desc: "SkyMiles \u00b7 certs \u00b7 MSP routes \u00b7 status", port: 3004, status: "live", stack: "React/Vite" },
  { id: "arsenal-intelligence", emoji: "\u{1F534}", label: "Arsenal Intelligence", desc: "Live standings \u00b7 form \u00b7 fixtures \u00b7 news", port: 3005, status: "live", stack: "React/Vite" },
  { id: "ai-work-journal", emoji: "\u{1F4D3}", label: "AI Work Journal", desc: "Projects \u00b7 Q&A \u00b7 Issues \u00b7 Learning log", port: 3006, status: "live", stack: "React/Vite" },
  { id: "brain-dump", emoji: "\u{1F9E0}", label: "Brain Dump", desc: "3am thought capture \u00b7 voice \u00b7 auto-tag", port: 3007, status: "live", stack: "React PWA" },
  { id: "elle-reading-stars", emoji: "\u2B50", label: "Elle's Reading Stars", desc: "Heart Words constellation \u00b7 LEGO bricks", port: 3008, status: "live", stack: "React PWA" },
  { id: "italy-trip-planner", emoji: "\u{1F1EE}\u{1F1F9}", label: "Italy Trip Planner", desc: "Aug 12\u201326 \u00b7 15 days \u00b7 4 tabs \u00b7 offline", port: 3009, status: "live", stack: "React PWA" },
  { id: "personal-finance", emoji: "\u{1F4B0}", label: "Personal Finance", desc: "Net worth \u00b7 Spending \u00b7 Investments \u00b7 Transactions", port: 3013, status: "live", stack: "React/Vite" },
  { id: "delta-award-bot", emoji: "\u{1F514}", label: "Delta Award Bot", desc: "MSP watchlist \u00b7 Telegram alerts \u00b7 3h checks", port: undefined, status: "live", stack: "Python" },
  { id: "arsenal-deep-stats", emoji: "\u{1F4CA}", label: "Arsenal Deep Stats", desc: "xG \u00b7 form \u00b7 squad status \u00b7 season trends", port: 3010, status: "live", stack: "React/Vite" },
];

const statusConfig: Record<Status, { label: string; classes: string; dot: string }> = {
  live: {
    label: "LIVE",
    classes: "text-[#16a34a] bg-green-50 border-green-200",
    dot: "bg-[#16a34a]",
  },
  building: {
    label: "BUILDING",
    classes: "text-[#d97706] bg-amber-50 border-amber-200",
    dot: "bg-[#d97706] animate-pulse",
  },
  planned: {
    label: "PLANNED",
    classes: "text-[#9ca3af] bg-gray-50 border-gray-200",
    dot: "bg-[#9ca3af]",
  },
};

export default function ProjectsPanel() {
  const [editMode, setEditMode] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHidden = useCallback(async () => {
    try {
      const data: string[] = await fetch("/api/projects/hidden").then((r) => r.json());
      setHiddenIds(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadHidden(); }, [loadHidden]);

  const toggleHide = useCallback(async (id: string) => {
    const willBeHidden = !hiddenIds.includes(id);
    setHiddenIds((prev) =>
      willBeHidden ? [...prev, id] : prev.filter((h) => h !== id)
    );
    try {
      await fetch("/api/projects/hidden", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, hidden: willBeHidden }),
      });
    } catch {
      await loadHidden();
    }
  }, [hiddenIds, loadHidden]);

  const visibleApps = editMode
    ? APPS
    : APPS.filter((a) => !hiddenIds.includes(a.id));

  const hiddenCount = hiddenIds.length;

  if (loading) {
    return <div className="text-[#9ca3af] text-sm animate-pulse py-4">Loading projects&hellip;</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] text-[#9ca3af] font-mono">
          {APPS.filter((a) => a.status === "live" && !hiddenIds.includes(a.id)).length} live
          {APPS.filter((a) => a.status === "building" && !hiddenIds.includes(a.id)).length > 0 && (
            <> &middot; {APPS.filter((a) => a.status === "building" && !hiddenIds.includes(a.id)).length} building</>
          )}
        </span>

        {!editMode && hiddenCount > 0 && (
          <button
            onClick={() => setEditMode(true)}
            className="text-[11px] text-[#9ca3af] hover:text-[#6b7280] font-mono transition-colors ml-1"
          >
            {hiddenCount} hidden
          </button>
        )}

        <button
          onClick={() => setEditMode((v) => !v)}
          className={`ml-auto text-[11px] border px-2.5 py-1 rounded-lg font-mono transition-colors ${
            editMode
              ? "text-[#2563eb] border-[#2563eb] bg-blue-50"
              : "text-[#6b7280] border-[#e5e7eb] hover:text-[#2563eb] hover:border-[#2563eb]"
          }`}
        >
          {editMode ? "Done" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {visibleApps.map((app) => {
          const cfg = statusConfig[app.status];
          const url = app.port ? `http://${HOST}:${app.port}` : undefined;
          const isHidden = hiddenIds.includes(app.id);

          const inner = (
            <div
              className={`relative flex flex-col gap-2 p-3 rounded-lg border bg-white transition-all duration-150 ${
                url && !editMode
                  ? "hover:border-[#2563eb] hover:shadow-sm cursor-pointer"
                  : editMode ? "cursor-default" : "opacity-60"
              } border-[#e5e7eb] ${isHidden && editMode ? "opacity-50 border-dashed" : ""}`}
            >
              {editMode && (
                <button
                  onClick={(e) => { e.preventDefault(); toggleHide(app.id); }}
                  className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded transition-colors ${
                    isHidden
                      ? "text-[#9ca3af] hover:text-[#2563eb]"
                      : "text-[#6b7280] hover:text-[#dc2626]"
                  }`}
                  title={isHidden ? "Show project" : "Hide project"}
                >
                  {isHidden ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{app.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#111827] leading-tight">
                      {app.label}
                    </p>
                    {app.stack && (
                      <p className="text-[10px] font-mono text-[#9ca3af] mt-0.5">
                        {app.stack}
                        {app.port ? ` \u00b7 :${app.port}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border shrink-0 ${cfg.classes}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] leading-snug">{app.desc}</p>
            </div>
          );

          if (url && !editMode) {
            return (
              <a key={app.id} href={url} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            );
          }
          return <div key={app.id}>{inner}</div>;
        })}
      </div>
    </div>
  );
}

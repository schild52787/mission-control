"use client";

const HOST = typeof window !== "undefined" ? window.location.hostname : "localhost";

type Status = "live" | "building" | "planned";

interface AppEntry {
  emoji: string;
  label: string;
  desc: string;
  port?: number;
  status: Status;
  stack?: string;
}

const APPS: AppEntry[] = [
  { emoji: "\u{1F3E0}", label: "Mission Control", desc: "This dashboard", port: 3000, status: "live", stack: "Next.js" },
  { emoji: "\u{1F4AA}", label: "FitTrack", desc: "Injury-safe workouts + PT", port: 3001, status: "live", stack: "React/Vite" },
  { emoji: "\u{1F4DA}", label: "Elle & Luka", desc: "Heart Words \u00b7 Phonics \u00b7 60 modules", port: 3002, status: "live", stack: "React/Vite" },
  { emoji: "\u{1F4B3}", label: "Card Optimizer", desc: "Benefits tracker + urgency alerts", port: 3003, status: "live", stack: "React/Vite" },
  { emoji: "\u2708\uFE0F", label: "Points Monitor", desc: "SkyMiles \u00b7 certs \u00b7 MSP routes \u00b7 status", port: 3004, status: "live", stack: "React/Vite" },
  { emoji: "\u{1F534}", label: "Arsenal Intelligence", desc: "Live standings \u00b7 form \u00b7 fixtures \u00b7 news", port: 3005, status: "live", stack: "React/Vite" },
  { emoji: "\u{1F4D3}", label: "AI Work Journal", desc: "Projects \u00b7 Q&A \u00b7 Issues \u00b7 Learning log", port: 3006, status: "live", stack: "React/Vite" },
  { emoji: "\u{1F9E0}", label: "Brain Dump", desc: "3am thought capture \u00b7 voice \u00b7 auto-tag", port: 3007, status: "live", stack: "React PWA" },
  { emoji: "\u2B50", label: "Elle's Reading Stars", desc: "Heart Words constellation \u00b7 LEGO bricks", port: 3008, status: "live", stack: "React PWA" },
  { emoji: "\u{1F1EE}\u{1F1F9}", label: "Italy Trip Planner", desc: "Aug 12\u201326 \u00b7 15 days \u00b7 4 tabs \u00b7 offline", port: 3009, status: "live", stack: "React PWA" },
  { emoji: "\u{1F4B0}", label: "Personal Finance", desc: "Net worth \u00b7 Spending \u00b7 Investments \u00b7 Transactions", port: 3013, status: "live", stack: "React/Vite" },
  { emoji: "\u{1F514}", label: "Delta Award Bot", desc: "MSP watchlist \u00b7 Telegram alerts \u00b7 3h checks", port: undefined, status: "live", stack: "Python" },
  { emoji: "\u{1F4CA}", label: "Arsenal Deep Stats", desc: "xG \u00b7 form \u00b7 squad status \u00b7 season trends", port: 3010, status: "live", stack: "React/Vite" },
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
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] text-[#9ca3af] font-mono">
          {APPS.filter((a) => a.status === "live").length} live &middot;{" "}
          {APPS.filter((a) => a.status === "building").length} building
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {APPS.map((app) => {
          const cfg = statusConfig[app.status];
          const url = app.port ? `http://${HOST}:${app.port}` : undefined;

          const inner = (
            <div
              className={`flex flex-col gap-2 p-3 rounded-lg border bg-white transition-all duration-150 ${
                url
                  ? "hover:border-[#2563eb] hover:shadow-sm cursor-pointer"
                  : "opacity-60"
              } border-[#e5e7eb]`}
            >
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

          return url ? (
            <a key={app.label} href={url} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <div key={app.label}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

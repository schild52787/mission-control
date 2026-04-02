"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface LaunchAgent {
  label: string;
  command: string;
  schedule: string;
  runAtLoad: boolean;
}

interface CronJob {
  schedule: string;
  command: string;
}

interface ScheduleData {
  launchAgents: LaunchAgent[];
  cronJobs: CronJob[];
}

function stripClawPrefix(label: string): string {
  return label.replace(/^ai\.claw\./, "");
}

export default function SchedulePage() {
  const [data, setData] = useState<ScheduleData>({ launchAgents: [], cronJobs: [] });
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schedule");
      const json: ScheduleData = await res.json();
      setData(json);
      setLastRefreshed(new Date());
    } catch {
      setData({ launchAgents: [], cronJobs: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111827]">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-[#6b7280] hover:text-[#2563eb] transition-colors flex items-center gap-1.5">
              &larr; Mission Control
            </Link>
            <span className="text-[#e5e7eb]">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span className="text-xs font-semibold tracking-[0.05em] text-[#111827] uppercase">Schedule</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <span className="hidden sm:block text-[11px] text-[#9ca3af] font-mono">
                {lastRefreshed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="text-xs text-[#6b7280] hover:text-[#2563eb] border border-[#e5e7eb] hover:border-[#2563eb] transition-colors px-2.5 py-1 rounded-lg font-mono disabled:opacity-50"
            >
              &#8635;
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-16 space-y-8">
        {loading && (
          <div className="flex items-center justify-center h-48 text-[#9ca3af]">
            Loading schedule&hellip;
          </div>
        )}

        {!loading && (
          <>
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#6b7280]">LaunchAgents</h2>
                <span className="text-[10px] font-mono text-[#9ca3af]">{data.launchAgents.length} jobs</span>
              </div>

              {data.launchAgents.length === 0 ? (
                <p className="text-sm text-[#9ca3af] italic">No ai.claw.* LaunchAgents found</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.launchAgents.map((agent, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-[#e5e7eb] bg-white">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
                        <span className="text-sm font-semibold text-[#111827] min-w-0">{stripClawPrefix(agent.label)}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4 sm:ml-0">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[#16a34a] whitespace-nowrap">
                          {agent.schedule}
                        </span>
                        {agent.runAtLoad && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 border border-[#e5e7eb] text-[#9ca3af]">
                            run at load
                          </span>
                        )}
                      </div>
                      <code
                        className="text-[11px] font-mono text-[#6b7280] bg-[#f9fafb] px-2 py-1 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap sm:flex-1 min-w-0"
                        title={agent.command}
                      >
                        {agent.command.length > 100 ? agent.command.slice(0, 100) + "\u2026" : agent.command}
                      </code>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#6b7280]">Cron Jobs</h2>
                <span className="text-[10px] font-mono text-[#9ca3af]">{data.cronJobs.length} jobs</span>
              </div>

              {data.cronJobs.length === 0 ? (
                <p className="text-sm text-[#9ca3af] italic">No cron jobs configured</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.cronJobs.map((job, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-[#e5e7eb] bg-white">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#d97706] shrink-0" />
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#d97706] font-mono whitespace-nowrap">
                          {job.schedule}
                        </span>
                      </div>
                      <code
                        className="text-[11px] font-mono text-[#6b7280] bg-[#f9fafb] px-2 py-1 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap sm:flex-1 min-w-0"
                        title={job.command}
                      >
                        {job.command.length > 100 ? job.command.slice(0, 100) + "\u2026" : job.command}
                      </code>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

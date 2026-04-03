"use client";

import { useEffect, useState, useCallback } from "react";

type Priority = "high" | "medium" | "low";

interface Action {
  id: string;
  priority: Priority;
  title: string;
  detail: string;
  url?: string;
  urlLabel?: string;
  deadline?: string;
  completed: boolean;
  completedAt: string | null;
}

const priorityConfig: Record<Priority, { dot: string; border: string }> = {
  high: { dot: "bg-[#dc2626]", border: "border-l-[#dc2626]" },
  medium: { dot: "bg-[#d97706]", border: "border-l-[#d97706]" },
  low: { dot: "bg-[#9ca3af]", border: "border-l-[#9ca3af]" },
};

const GATEWAY_CMD =
  "launchctl bootout gui/$UID/ai.openclaw.gateway && sleep 2 && launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.gateway.plist";

export default function ActionsPanel() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data: Action[] = await fetch("/api/actions").then((r) => r.json());
      setActions(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleComplete = useCallback(async (id: string, currentlyCompleted: boolean) => {
    const newCompleted = !currentlyCompleted;
    setActions((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null }
          : a
      )
    );
    try {
      await fetch("/api/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: newCompleted }),
      });
    } catch {
      await load();
    }
  }, [load]);

  if (loading) {
    return <div className="text-[#9ca3af] text-sm animate-pulse py-4">Loading actions&hellip;</div>;
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...actions].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const highCount = actions.filter((a) => a.priority === "high" && !a.completed).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] font-mono text-[#dc2626]">
          {highCount} high priority
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map((action) => {
          const cfg = priorityConfig[action.priority];
          return (
            <div
              key={action.id}
              className={`p-3 rounded-lg border border-[#e5e7eb] bg-white border-l-[3px] ${cfg.border} transition-opacity duration-200 ${
                action.completed ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start gap-2.5">
                <button
                  onClick={() => toggleComplete(action.id, action.completed)}
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    action.completed
                      ? "bg-[#16a34a] border-[#16a34a]"
                      : "border-[#d1d5db] hover:border-[#16a34a]"
                  }`}
                  aria-label={action.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {action.completed && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold text-[#111827] leading-tight ${
                      action.completed ? "line-through text-[#9ca3af]" : ""
                    }`}>
                      {action.title}
                    </p>
                    {action.deadline && !action.completed && (
                      <span className="text-[10px] font-mono text-[#d97706] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                        &#9201; {action.deadline}
                      </span>
                    )}
                  </div>
                  {!action.completed && (
                    <>
                      <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">{action.detail}</p>
                      {action.id === "gateway-fix" && (
                        <code className="block mt-2 text-[10px] font-mono text-[#111827] bg-[#f9fafb] border border-[#e5e7eb] rounded px-2.5 py-1.5 leading-relaxed break-all">
                          {GATEWAY_CMD}
                        </code>
                      )}
                      {action.url && (
                        <a
                          href={action.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-xs text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                        >
                          {action.urlLabel ?? action.url} &#8599;
                        </a>
                      )}
                    </>
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

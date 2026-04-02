"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import type { WorkoutEntry } from "@/app/api/workout/route";

const DAY_FOCUS = ["Rest", "Pull", "Push", "Legs", "Core+PT", "Pull", "Push"];

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, "MMM d");
  } catch {
    return dateStr;
  }
}

interface Props {
  refreshTrigger?: number;
}

export default function WorkoutPanel({ refreshTrigger }: Props) {
  const [log, setLog] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workout");
      const data = await res.json();
      setLog(data.log ?? []);
    } catch {
      setLog([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const todayFocus = DAY_FOCUS[new Date().getDay()];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-mono border border-purple-200">
          TODAY: {todayFocus}
        </span>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af] text-sm">
          Loading&hellip;
        </div>
      )}

      {!loading && log.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af] text-sm">
          No workouts logged yet
        </div>
      )}

      {!loading && log.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {log.map((entry, i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb]"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-[#111827] truncate max-w-[65%]">
                  {entry.exercise}
                </span>
                <span className="text-xs text-[#9ca3af] font-mono shrink-0">
                  {formatDate(entry.date)}
                </span>
              </div>
              <div className="text-xs text-[#6b7280] font-mono">
                {entry.sets}&times;{entry.reps}@{entry.weight}lbs
              </div>
              {entry.notes && (
                <div className="text-xs text-[#9ca3af] mt-0.5 truncate">
                  {entry.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

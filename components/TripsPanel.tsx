"use client";

import { useMemo } from "react";
import { parseISO, differenceInDays, format, addDays } from "date-fns";
import type { CalendarEvent } from "@/app/api/calendar/route";

const TRAVEL_KEYWORDS = [
  "hotel", "flight", "reservation", "stay", "airline", "delta",
  "resort", "united", "southwest", "marriott", "hilton", "hyatt",
  "airbnb", "rental car", "airport", "cruise",
];

function isTravelEvent(ev: CalendarEvent): boolean {
  const lower = ev.summary.toLowerCase();
  return TRAVEL_KEYWORDS.some((kw) => lower.includes(kw));
}

interface Props {
  allEvents: CalendarEvent[];
}

export default function TripsPanel({ allEvents }: Props) {
  const trips = useMemo(() => {
    const now = new Date();
    const in90d = addDays(now, 90);
    return allEvents
      .filter((ev) => {
        try {
          const start = parseISO(ev.start);
          return start >= now && start <= in90d && isTravelEvent(ev);
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [allEvents]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        {trips.length > 0 && (
          <span className="text-xs bg-amber-50 text-[#d97706] px-2 py-0.5 rounded-full font-mono border border-amber-200">
            {trips.length} trips
          </span>
        )}
      </div>

      {trips.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af] text-sm">
          No trips in next 90 days
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
        {trips.map((ev) => {
          const start = parseISO(ev.start);
          const daysUntil = differenceInDays(start, new Date());
          return (
            <div
              key={ev.id}
              className="p-2.5 rounded-lg border border-[#e5e7eb] bg-[#f9fafb]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-[#111827] font-medium leading-snug">
                  {ev.summary}
                </span>
                <span className="text-xs font-mono text-[#d97706] shrink-0 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                  {daysUntil === 0 ? "TODAY" : daysUntil === 1 ? "tmrw" : `${daysUntil}d`}
                </span>
              </div>
              <div className="text-xs text-[#6b7280] mt-1">
                {format(start, "EEE, MMM d")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

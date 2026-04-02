"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO, isToday, isTomorrow, differenceInMinutes } from "date-fns";
import type { CalendarEvent } from "@/app/api/calendar/route";
import clsx from "clsx";

interface Props {
  onDataLoad?: (events: CalendarEvent[]) => void;
  refreshTrigger?: number;
}

function eventColor(start: string): string {
  try {
    const h = parseISO(start).getHours();
    if (h < 9) return "border-l-purple-400";
    if (h < 12) return "border-l-[#2563eb]";
    if (h < 17) return "border-l-[#16a34a]";
    return "border-l-[#d97706]";
  } catch {
    return "border-l-[#9ca3af]";
  }
}

function dayLabel(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (isToday(d)) return "TODAY";
    if (isTomorrow(d)) return "TOMORROW";
    return format(d, "EEE MMM d");
  } catch {
    return dateStr;
  }
}

export default function CalendarPanel({ onDataLoad, refreshTrigger }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/calendar");
      const data: CalendarEvent[] = await res.json();
      setEvents(data);
      setLastRefreshed(new Date());
      onDataLoad?.(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [onDataLoad]);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    const day = ev.start.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(ev);
    return acc;
  }, {});

  const now = new Date();

  return (
    <div className="flex flex-col h-full">
      {lastRefreshed && (
        <p className="text-[10px] text-[#9ca3af] font-mono mb-2">
          {format(lastRefreshed, "h:mm a")}
        </p>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af] text-sm">
          Loading&hellip;
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center text-[#dc2626] text-sm">
          Failed to load calendar
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af] text-sm">
          No events in next 48h
        </div>
      )}

      {!loading && !error && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              <div className="text-xs font-semibold text-[#6b7280] tracking-widest mb-2 uppercase">
                {dayLabel(day)}
              </div>
              <div className="space-y-1.5">
                {dayEvents.map((ev) => {
                  const startDate = parseISO(ev.start);
                  const isPast = startDate < now;
                  const isNow = startDate <= now && parseISO(ev.end) > now;
                  const minsUntil = differenceInMinutes(startDate, now);
                  const soon = minsUntil > 0 && minsUntil <= 30;

                  return (
                    <div
                      key={ev.id}
                      className={clsx(
                        "border-l-2 pl-3 py-1.5 rounded-r bg-[#f9fafb]",
                        eventColor(ev.start),
                        isPast && "opacity-40",
                        isNow && "bg-blue-50 ring-1 ring-blue-200"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-mono text-[#6b7280] shrink-0 w-16">
                          {format(startDate, "h:mm a")}
                        </span>
                        <span
                          className={clsx(
                            "text-sm leading-snug",
                            isNow ? "text-[#2563eb] font-medium" : "text-[#111827]"
                          )}
                        >
                          {ev.summary}
                        </span>
                      </div>
                      {soon && (
                        <div className="text-xs text-[#d97706] mt-0.5 pl-[4.5rem]">
                          in {minsUntil} min
                        </div>
                      )}
                      {isNow && (
                        <div className="text-xs text-[#2563eb] mt-0.5 pl-[4.5rem]">
                          NOW
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

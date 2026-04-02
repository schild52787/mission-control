"use client";

import { useMemo } from "react";
import { parseISO, differenceInMinutes, format } from "date-fns";
import type { CalendarEvent } from "@/app/api/calendar/route";
import type { EmailMessage } from "@/app/api/inbox/route";
import type { WeatherData } from "@/app/api/weather/route";
import clsx from "clsx";

interface Props {
  events: CalendarEvent[];
  messages: EmailMessage[];
  weather: WeatherData | null;
}

export default function StatsPanel({ events, messages, weather }: Props) {
  const nextEvent = useMemo(() => {
    const now = new Date();
    return events
      .map((ev) => ({ ev, start: parseISO(ev.start) }))
      .filter(({ start }) => start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  }, [events]);

  const nextEventMins = nextEvent
    ? differenceInMinutes(nextEvent.start, new Date())
    : null;

  const urgencyColor =
    nextEventMins !== null
      ? nextEventMins <= 15
        ? "text-[#dc2626]"
        : nextEventMins <= 60
        ? "text-[#d97706]"
        : "text-[#16a34a]"
      : "text-[#9ca3af]";

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#6b7280] mb-3">
        Today
      </h2>

      <div className="flex-1 flex flex-col gap-3">
        {/* Weather */}
        <div className="p-3 rounded-lg bg-[#f9fafb] border border-[#e5e7eb]">
          <div className="text-[11px] text-[#9ca3af] mb-1 uppercase tracking-wider">MSP Weather</div>
          {weather ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{weather.icon}</span>
              <div>
                <div className="text-lg font-bold text-[#111827]">{weather.temp_f}&deg;F</div>
                <div className="text-xs text-[#6b7280]">{weather.condition}</div>
              </div>
            </div>
          ) : (
            <div className="text-[#9ca3af] text-sm">&mdash;</div>
          )}
        </div>

        {/* Next event */}
        <div className="p-3 rounded-lg bg-[#f9fafb] border border-[#e5e7eb]">
          <div className="text-[11px] text-[#9ca3af] mb-1 uppercase tracking-wider">Next Event</div>
          {nextEvent ? (
            <>
              <div className={clsx("text-lg font-bold font-mono", urgencyColor)}>
                {nextEventMins === 0
                  ? "NOW"
                  : nextEventMins! < 60
                  ? `${nextEventMins}m`
                  : `${Math.floor(nextEventMins! / 60)}h ${nextEventMins! % 60}m`}
              </div>
              <div className="text-xs text-[#111827] mt-0.5 truncate">{nextEvent.ev.summary}</div>
              <div className="text-xs text-[#9ca3af] mt-0.5">{format(nextEvent.start, "h:mm a")}</div>
            </>
          ) : (
            <div className="text-[#9ca3af] text-sm">No upcoming events</div>
          )}
        </div>

        {/* Unread count */}
        <div className="p-3 rounded-lg bg-[#f9fafb] border border-[#e5e7eb]">
          <div className="text-[11px] text-[#9ca3af] mb-1 uppercase tracking-wider">Priority Unread</div>
          <div className={clsx("text-3xl font-bold font-mono", messages.length > 0 ? "text-[#2563eb]" : "text-[#9ca3af]")}>
            {messages.length}
          </div>
          {messages.length === 0 && <div className="text-xs text-[#9ca3af] mt-0.5">Inbox zero</div>}
        </div>

        {/* Today event count */}
        <div className="p-3 rounded-lg bg-[#f9fafb] border border-[#e5e7eb]">
          <div className="text-[11px] text-[#9ca3af] mb-1 uppercase tracking-wider">Events Today</div>
          {(() => {
            const today = new Date().toDateString();
            const todayEvents = events.filter((ev) => new Date(ev.start).toDateString() === today);
            return <div className="text-3xl font-bold font-mono text-[#2563eb]">{todayEvents.length}</div>;
          })()}
        </div>
      </div>
    </div>
  );
}

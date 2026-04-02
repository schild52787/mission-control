"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FlightMonitorData, StatusRoute, AlertEntry } from "@/app/api/flight-monitor/route";

function ago(iso: string | null): string {
  if (!iso) return "\u2014";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function fmtValue(r: StatusRoute): string {
  if (r.lowest === null) return "\u2014";
  return r.unit === "$" ? `$${r.lowest.toLocaleString()}` : `${r.lowest.toLocaleString()} mi`;
}

function eventLabel(e: AlertEntry): string {
  const cash = e.kind === "cash";
  const fmt = (v: number) => cash ? `$${v.toLocaleString()}` : `${v.toLocaleString()} mi`;
  if (e.event === "first_capture") return `First ${cash ? "price" : "points"}: ${fmt(e.value)}`;
  if (e.event === "new_low") return `${cash ? "New low" : "Points drop"}: ${fmt(e.value)}${e.prev ? ` (was ${fmt(e.prev)})` : ""}`;
  return `Alert: ${fmt(e.value)}`;
}

function RouteRow({ r }: { r: StatusRoute }) {
  const isAward = r.kind === "award";
  const hasValue = r.lowest !== null;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#e5e7eb] last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`text-[10px] font-mono font-bold shrink-0 px-1.5 py-0.5 rounded border ${
          isAward
            ? "text-purple-600 bg-purple-50 border-purple-200"
            : "text-[#2563eb] bg-blue-50 border-blue-200"
        }`}>
          {isAward ? "MI" : "$"}
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[#111827] truncate">{r.route}</div>
          <div className="text-[10px] text-[#9ca3af] font-mono truncate">{r.date} &middot; {r.airline}</div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <div className={`text-sm font-bold tabular-nums ${
          hasValue
            ? isAward ? "text-purple-600" : "text-[#111827]"
            : "text-[#9ca3af]"
        }`}>
          {fmtValue(r)}
        </div>
        <div className="text-[10px] text-[#9ca3af] font-mono">checked {ago(r.last_check)}</div>
      </div>
    </div>
  );
}

function AlertRow({ a }: { a: AlertEntry }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-xs mt-0.5 shrink-0">{a.kind === "award" ? "\u{1F3AB}" : "\u{1F4B5}"}</span>
      <div className="min-w-0">
        <div className="text-xs text-[#6b7280] leading-snug">{eventLabel(a)}</div>
        <div className="text-[10px] text-[#9ca3af] font-mono">{a.route} &middot; {ago(a.ts)}</div>
      </div>
    </div>
  );
}

export default function MomFlightsWidget() {
  const [data, setData] = useState<FlightMonitorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/flight-monitor")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));

    const id = setInterval(() => {
      fetch("/api/flight-monitor").then((r) => r.json()).then(setData).catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-[#9ca3af] animate-pulse font-mono">
        Loading flight monitor&hellip;
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-4 text-center text-xs text-[#9ca3af]">
        Flight monitor unavailable
      </div>
    );
  }

  const cashRoutes = data.routes.filter((r) => r.kind === "cash");
  const awardRoutes = data.routes.filter((r) => r.kind === "award");
  const recentAlerts = data.alerts.slice(0, 4);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold tracking-widest text-[#9ca3af] uppercase mb-1">
          Cash Prices
        </p>
        <div>
          {cashRoutes.map((r) => <RouteRow key={r.route + r.date + r.kind} r={r} />)}
        </div>
      </div>

      {awardRoutes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-[#9ca3af] uppercase mb-1">
            Points / Award
          </p>
          <div>
            {awardRoutes.map((r) => <RouteRow key={r.route + r.date + r.kind} r={r} />)}
          </div>
        </div>
      )}

      {recentAlerts.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-[#9ca3af] uppercase mb-1">
            Recent Alerts
          </p>
          <div className="bg-[#f9fafb] rounded-lg px-3 border border-[#e5e7eb]">
            {recentAlerts.map((a, i) => <AlertRow key={i} a={a} />)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-[#9ca3af] font-mono">
          Bot runs every 8h &middot; {data.last_run ? ago(data.last_run) : "pending first run"}
        </span>
        <Link
          href="/mom-travel"
          className="text-[10px] font-semibold text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
        >
          Full details &rarr;
        </Link>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const BASE = path.join(os.homedir(), "projects/flight-monitor");
const CACHE_PATH   = path.join(BASE, "cache.json");
const ALERTS_PATH  = path.join(BASE, "alerts.json");
const STATUS_PATH  = path.join(BASE, "status.json");

export interface AlertEntry {
  ts: string;
  route: string;
  label: string;
  kind: "cash" | "award";
  event: string;
  value: number;
  prev: number | null;
  url: string;
}

export interface StatusRoute {
  label: string;
  route: string;
  date: string;
  airline: string;
  kind: "cash" | "award";
  lowest: number | null;
  unit: "$" | "mi";
  last_check: string | null;
  last_alert: string | null;
  last_url: string | null;
  source?: string;
  // Award-only fields
  fees_usd?: number | null;
  program?: string;
  cabin?: string;
  net_cpp?: number | null;
  verdict?: string | null;
  avail?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all_programs?: any[];
}

export interface FlightMonitorData {
  routes: StatusRoute[];
  alerts: AlertEntry[];
  last_run: string | null;
  cacheExists: boolean;
}

function readJSON<T>(p: string, fallback: T): T {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch { /* ignore */ }
  return fallback;
}

// Fallback: build route list from raw cache if status.json not yet written
const ROUTE_META: { key: string; label: string; route: string; date: string; airline: string; kind: "cash" | "award"; unit: "$" | "mi" }[] = [
  { key: "OPO-ORD-2026-05-27-cash",  label: "Mom — OPO → ORD", route: "OPO→ORD", date: "2026-05-27", airline: "American / Iberia", kind: "cash",  unit: "$" },
  { key: "AMS-MSP-2026-07-27-cash",  label: "Mom — AMS → MSP", route: "AMS→MSP", date: "2026-07-27", airline: "Delta Air Lines",   kind: "cash",  unit: "$" },
  { key: "AMS-MSP-2026-07-27-award", label: "Mom — AMS → MSP", route: "AMS→MSP", date: "2026-07-27", airline: "Flying Blue",       kind: "award", unit: "mi" },
];

export async function GET() {
  const cacheExists = fs.existsSync(CACHE_PATH);
  const cache = readJSON<Record<string, Record<string, unknown>>>(CACHE_PATH, {});
  const alertsRaw = readJSON<{ alerts: AlertEntry[] }>(ALERTS_PATH, { alerts: [] });
  const statusRaw = readJSON<{ routes: StatusRoute[]; last_run: string }>(STATUS_PATH, { routes: [], last_run: "" });

  let routes: StatusRoute[];
  if (statusRaw.routes.length > 0) {
    routes = statusRaw.routes;
  } else {
    // Build from cache directly (status.json not yet written)
    routes = ROUTE_META.map(({ key, label, route, date, airline, kind, unit }) => {
      const entry = cache[key] as Record<string, unknown> | undefined;
      const base: StatusRoute = {
        label, route, date, airline, kind, unit,
        lowest:     (entry?.lowest     as number | null) ?? null,
        last_check: (entry?.last_check as string | null) ?? null,
        last_alert: (entry?.last_alert as string | null) ?? null,
        last_url:   (entry?.last_url   as string | null) ?? null,
        source:     (entry?.source     as string | undefined),
      };
      if (kind === "award") {
        base.fees_usd     = (entry?.fees_usd     as number | null) ?? null;
        base.program      = (entry?.program      as string | undefined);
        base.cabin        = (entry?.cabin        as string | undefined);
        base.net_cpp      = (entry?.net_cpp      as number | null) ?? null;
        base.verdict      = (entry?.verdict      as string | null) ?? null;
        base.avail        = (entry?.avail        as string | null) ?? null;
        base.all_programs = (entry?.all_programs as unknown[] | undefined);
      }
      return base;
    });
  }

  return NextResponse.json({
    routes,
    alerts: alertsRaw.alerts.slice(0, 10),
    last_run: statusRaw.last_run || null,
    cacheExists,
  } satisfies FlightMonitorData);
}

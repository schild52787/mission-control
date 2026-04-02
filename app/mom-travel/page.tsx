"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FlightMonitorData, StatusRoute } from "@/app/api/flight-monitor/route";

// --- Types ---

type RouteData = StatusRoute;

// --- Helpers ---

function fmtDate(iso: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtRouteDate(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

// --- Sub-components ---

function StatusBadge({ booked, onClick }: { booked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
        booked
          ? "bg-green-50 border-green-200 text-[#16a34a]"
          : "bg-[#f9fafb] border-[#e5e7eb] text-[#9ca3af] hover:border-[#d97706] hover:text-[#d97706]"
      }`}
    >
      <span>{booked ? "\u2713" : "\u25CB"}</span>
      <span>{booked ? "Booked" : "Not booked"}</span>
    </button>
  );
}

function RouteStrip({
  origin, originCity, destination, destCity, date, airline,
}: { origin: string; originCity: string; destination: string; destCity: string; date: string; airline: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#e5e7eb] mb-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-[#111827] font-mono tracking-wider">{origin}</div>
        <div className="text-xs text-[#9ca3af] mt-0.5">{originCity}</div>
      </div>
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="w-full flex items-center gap-1">
          <div className="flex-1 h-px bg-[#e5e7eb]" />
          <span className="text-[#9ca3af] text-xs">\u2708</span>
          <div className="flex-1 h-px bg-[#e5e7eb]" />
        </div>
        <div className="text-xs text-[#9ca3af]">{airline}</div>
        <div className="text-xs text-[#2563eb] font-mono">{fmtRouteDate(date)}</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-[#111827] font-mono tracking-wider">{destination}</div>
        <div className="text-xs text-[#9ca3af] mt-0.5">{destCity}</div>
      </div>
    </div>
  );
}

function AwardRow({
  program, miles, cabin, fees, recommended,
}: { program: string; miles: string; cabin: string; fees: string; recommended?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg border ${
      recommended ? "border-blue-200 bg-blue-50" : "border-[#e5e7eb] bg-[#f9fafb]"
    }`}>
      <div className="flex items-center gap-2">
        {recommended && <span className="text-[#2563eb] text-xs font-bold uppercase tracking-wider">\u2605 Best</span>}
        <div>
          <div className="text-sm font-semibold text-[#111827]">{program}</div>
          <div className="text-xs text-[#9ca3af]">{cabin}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-[#111827]">{miles}</div>
        <div className="text-xs text-[#9ca3af]">{fees}</div>
      </div>
    </div>
  );
}

function MonitorPrice({ data, label }: { data: RouteData | undefined; label: string }) {
  if (!data) return null;
  return (
    <div className="flex items-center justify-between bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2">
      <div>
        <div className="text-xs text-[#6b7280] uppercase tracking-wider">{label}</div>
        <div className="text-xs text-[#9ca3af] mt-0.5">
          Updated {fmtDate(data.last_check)}
        </div>
      </div>
      <div className="text-right">
        {data.lowest ? (
          <>
            <div className="text-lg font-bold text-[#d97706]">${data.lowest.toLocaleString()}</div>
            <div className="text-xs text-[#9ca3af]">route avg &middot; verify live</div>
          </>
        ) : (
          <div className="text-sm text-[#9ca3af]">No data yet</div>
        )}
      </div>
    </div>
  );
}

interface AwardProgram {
  program: string;
  miles_rt: number | null;
  miles_ow_est: number | null;
  stops: string;
  operated_by: string;
  transfers?: string[];
  note?: string;
}

function LiveAwardPanel({ data }: { data: RouteData | undefined }) {
  if (!data) return null;

  const isChart  = data.source === "awardhacker_chart";
  const programs = (data as unknown as { all_programs?: AwardProgram[] }).all_programs ?? [];

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wider">Award Programs &mdash; AMS &rarr; MSP</span>
          {isChart && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 border border-green-200 text-[#16a34a] uppercase tracking-wider">
              Live chart data
            </span>
          )}
        </div>
        <span className="text-xs text-[#9ca3af]">{fmtDate(data.last_check)}</span>
      </div>

      {/* Best pick highlight */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wider mb-1">\u2B50 Best option</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-[#111827]">
              ~15,000 <span className="text-sm text-[#6b7280]">VS miles</span>
            </div>
            <div className="text-xs text-[#6b7280]">Virgin Atlantic &middot; KLM nonstop &middot; one-way est.</div>
            <div className="text-xs text-[#9ca3af] mt-0.5">Transfer from: Amex MR &middot; Chase UR &middot; Citi &middot; Capital One</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#16a34a] font-bold">3.7&times; cheaper</div>
            <div className="text-xs text-[#9ca3af]">vs Flying Blue quote</div>
          </div>
        </div>
      </div>

      {/* All programs table */}
      {programs.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">All programs (AwardHacker chart &mdash; verify availability before transferring)</div>
          {programs.map((p, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
              i === 0 ? "bg-green-50 border border-green-200" : "bg-[#f9fafb] border border-[#e5e7eb]"
            }`}>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[#111827]">{p.program}</span>
                <span className="text-[#9ca3af] text-xs ml-2">{p.stops} &middot; {p.operated_by}</span>
                {p.note && <span className="text-[#d97706] text-xs ml-2">({p.note})</span>}
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                {p.miles_ow_est ? (
                  <span className={`font-bold font-mono ${i === 0 ? "text-[#16a34a]" : "text-[#111827]"}`}>
                    ~{(p.miles_ow_est / 1000).toFixed(0)}k <span className="text-xs text-[#9ca3af]">OW</span>
                  </span>
                ) : (
                  <span className="text-[#9ca3af] text-xs">dynamic</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Source note */}
      <div className="text-[10px] text-[#9ca3af] leading-relaxed">
        Chart rates from AwardHacker (live search Feb 27 2026). One-way estimated at &frac12; round-trip.
        Confirm seat availability on the program site before transferring miles &mdash; award space is not guaranteed.
        <a href="https://www.awardhacker.com/?from=AMS&to=MSP" target="_blank" rel="noopener noreferrer"
          className="text-[#2563eb] hover:text-[#1d4ed8] ml-1 underline">Search AwardHacker &rarr;</a>
      </div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 rounded-full bg-[#f9fafb] border border-[#e5e7eb] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-[#6b7280]">{n}</span>
      </div>
      <p className="text-sm text-[#6b7280] leading-relaxed">{text}</p>
    </div>
  );
}

function Tip({ icon, text, highlight }: { icon: string; text: string; highlight?: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${
      highlight ? "border-amber-200 bg-amber-50" : "border-[#e5e7eb] bg-[#f9fafb]"
    }`}>
      <span className="text-base">{icon}</span>
      <p className="text-sm text-[#6b7280] leading-relaxed">{text}</p>
    </div>
  );
}

// --- Main page ---

export default function MomTravelPage() {
  const [monitor, setMonitor] = useState<FlightMonitorData | null>(null);
  const [booked, setBooked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Load monitor data
  useEffect(() => {
    fetch("/api/flight-monitor")
      .then((r) => r.json())
      .then((d) => { setMonitor(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Load booked status from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("mom-travel-booked");
    if (stored) {
      try { setBooked(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const toggleBooked = (key: string) => {
    setBooked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("mom-travel-booked", JSON.stringify(next));
      return next;
    });
  };

  const getRoute = (routeStr: string, date: string, kind: "cash" | "award") =>
    monitor?.routes.find((r) => r.route === routeStr && r.date === date && r.kind === kind);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111827]">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-[#6b7280] hover:text-[#2563eb] transition-colors flex items-center gap-1.5">
              &larr; Mission Control
            </Link>
            <span className="text-[#e5e7eb]">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-[0.05em] text-[#111827] uppercase">
                Mom&apos;s Travel
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#9ca3af] font-mono">
            {loading ? "Loading..." : monitor?.cacheExists ? "Monitor active \u2713" : "Monitor pending"}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4 pb-16">

        {/* Intro */}
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-xs font-bold tracking-widest text-purple-600 uppercase mb-1">Research Summary</p>
          <h1 className="text-xl font-bold text-[#111827] mb-2">Two Flights &middot; Spring &amp; Summer 2026</h1>
          <p className="text-sm text-[#6b7280] leading-relaxed">
            Both routes validated across AwardWallet, TPG, ThriftyTraveler, FlyerTalk, and Reddit r/awardtravel.
            Prices monitored every 8 hours. Award options confirmed on fixed partner charts &mdash; not dynamic.
          </p>
        </div>

        {/* ROUTE 1: OPO -> ORD */}
        <section className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">

          {/* Card header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb] px-2 py-0.5 rounded">
                LEG 1
              </span>
              <span className="text-sm font-semibold text-[#111827]">Porto &rarr; Chicago</span>
            </div>
            <StatusBadge
              booked={!!booked["opo-ord"]}
              onClick={() => toggleBooked("opo-ord")}
            />
          </div>

          <div className="px-5 py-4 space-y-5">
            <RouteStrip
              origin="OPO" originCity="Porto"
              destination="ORD" destCity="Chicago"
              date="2026-05-27"
              airline="American / Iberia"
            />

            {/* Award options */}
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                Award Options &mdash; AA AAdvantage miles
              </p>
              <div className="space-y-2">
                <AwardRow
                  program="Iberia via Madrid (MAD)"
                  miles="30,000 mi"
                  cabin="Economy &middot; OPO &rarr; MAD &rarr; ORD"
                  fees="~$50&ndash;75 in fees"
                  recommended
                />
                <AwardRow
                  program="Iberia via Madrid (MAD)"
                  miles="57,500 mi"
                  cabin="Business Class"
                  fees="~$155 in fees"
                />
                <AwardRow
                  program="British Airways via London"
                  miles="30,000 mi"
                  cabin="Economy &middot; OPO &rarr; LHR &rarr; ORD"
                  fees="&x26A0;&xFE0F; $300&ndash;500 surcharges &mdash; avoid"
                />
              </div>
            </div>

            {/* Cash monitor */}
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                Cash Price Monitor
              </p>
              {loading ? (
                <div className="text-sm text-[#9ca3af] animate-pulse">Loading&hellip;</div>
              ) : (
                <MonitorPrice
                  data={getRoute("OPO\u2192ORD", "2026-05-27", "cash")}
                  label="Route avg &middot; OPO &rarr; ORD"
                />
              )}
            </div>

            {/* How to book */}
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">
                How to book (award)
              </p>
              <div className="space-y-3">
                <Step n={1} text="Log into aa.com with an AAdvantage account. Check 'Redeem miles' on the search form." />
                <Step n={2} text="Search OPO \u2192 ORD, May 27, one-way. Iberia will appear as a partner option \u2014 select OPO\u2192MAD\u2192ORD itinerary." />
                <Step n={3} text="If no availability on aa.com, also check iberia.com directly with Iberia Avios \u2014 sometimes shows space AA.com doesn't." />
                <Step n={4} text="Avoid any British Airways itinerary \u2014 fuel surcharges ($300\u2013500) eliminate the value." />
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.aa.com/booking/search?bookingPath=oneWay&passengers.adultPassengerCount=1&slices[0].origin=OPO&slices[0].destination=ORD&slices[0].departureDate=2026-05-27&redeemMiles=true"
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#2563eb] hover:bg-blue-100 transition-colors"
              >
                &nearr; AA.com &mdash; Award Search
              </a>
              <a
                href="https://www.google.com/travel/flights?q=OPO+to+ORD+May+27+2026+one+way"
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
              >
                &nearr; Google Flights &mdash; Cash
              </a>
              <a
                href="https://www.iberia.com/us/en/flights/?"
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
              >
                &nearr; Iberia.com &mdash; Award Backup
              </a>
            </div>
          </div>
        </section>

        {/* ROUTE 2: AMS -> MSP */}
        <section className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">

          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb] px-2 py-0.5 rounded">
                LEG 2
              </span>
              <span className="text-sm font-semibold text-[#111827]">Amsterdam &rarr; Minneapolis</span>
            </div>
            <StatusBadge
              booked={!!booked["ams-msp"]}
              onClick={() => toggleBooked("ams-msp")}
            />
          </div>

          <div className="px-5 py-4 space-y-5">
            <RouteStrip
              origin="AMS" originCity="Amsterdam"
              destination="MSP" destCity="Minneapolis"
              date="2026-07-27"
              airline="Delta Air Lines"
            />

            {/* Live award monitor panel */}
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                Flying Blue Award &mdash; Live Monitor
              </p>
              {loading ? (
                <div className="text-sm text-[#9ca3af] animate-pulse">Loading&hellip;</div>
              ) : (
                <LiveAwardPanel data={getRoute("AMS\u2192MSP", "2026-07-27", "award")} />
              )}
            </div>

            {/* Cash monitor */}
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                Cash Price Monitor
              </p>
              {loading ? (
                <div className="text-sm text-[#9ca3af] animate-pulse">Loading&hellip;</div>
              ) : (
                <MonitorPrice
                  data={getRoute("AMS\u2192MSP", "2026-07-27", "cash")}
                  label="Route avg &middot; AMS &rarr; MSP"
                />
              )}
            </div>

            {/* How to book */}
            <div>
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">
                How to book (award)
              </p>
              <div className="space-y-3">
                <Step n={1} text="Open flyingblue.com and log into a Flying Blue account (or create one \u2014 free)." />
                <Step n={2} text="Search AMS \u2192 MSP, July 27, one-way. Delta flight DL will appear. Select it." />
                <Step n={3} text="Before transferring points, check if a transfer bonus is active from Amex MR, Chase UR, or Capital One. A 25% bonus brings cost from 22,500 to ~18,000 points." />
                <Step n={4} text="Book at least 60 days before travel (before May 28). Partner award prices spike sharply inside 60 days on Flying Blue." />
                <Step n={5} text="If using Delta SkyMiles directly \u2014 book under Melissa's Delta Reserve Amex account for TakeOff15 (15% off)." />
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              <a
                href="https://www.flyingblue.com/en/spend/flights/search"
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#2563eb] hover:bg-blue-100 transition-colors"
              >
                &nearr; FlyingBlue.com &mdash; Award Search
              </a>
              <a
                href="https://www.virginatlantic.com/us/en/book-a-flight.html"
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
              >
                &nearr; Virgin Atlantic &mdash; Backup
              </a>
              <a
                href="https://www.google.com/travel/flights?q=AMS+to+MSP+July+27+2026+one+way"
                target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb] hover:text-[#2563eb] transition-colors"
              >
                &nearr; Google Flights &mdash; Cash
              </a>
            </div>
          </div>
        </section>

        {/* Tips & Warnings */}
        <section className="bg-white border border-[#e5e7eb] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <p className="text-xs font-bold tracking-widest text-[#6b7280] uppercase">Key Notes</p>
          <div className="space-y-2">
            <Tip
              icon="\u23F0"
              highlight
              text="Book AMS \u2192 MSP (Flying Blue) before May 28 \u2014 partner award prices spike dramatically inside 60 days of travel. This is the hardest deadline of the two."
            />
            <Tip
              icon="\u2708\uFE0F"
              text="OPO \u2192 ORD award availability: check both aa.com (AAdvantage search) AND iberia.com (Iberia+ Avios). The same flight sometimes shows availability on one and not the other."
            />
            <Tip
              icon="\uD83D\uDEAB"
              text="Never book British Airways on American miles for transatlantic. Fuel surcharges of $300\u2013500+ destroy the value. Always pick Iberia or Finnair when given the option."
            />
            <Tip
              icon="\uD83D\uDD04"
              text="Flying Blue promo awards are now only bookable departing from AMS or CDG. Your mom departing AMS is in the eligible bucket \u2014 this is ideal."
            />
            <Tip
              icon="\uD83D\uDCCA"
              text="Cash prices monitored every 8h. Route averages only \u2014 not May 27 / July 27 specific. Always verify on Google Flights before booking."
            />
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-[#9ca3af] font-mono">
            Monitored by Claw &middot; Flight bot runs every 8h &middot; Research validated Feb 25, 2026
          </p>
        </div>

      </main>
    </div>
  );
}

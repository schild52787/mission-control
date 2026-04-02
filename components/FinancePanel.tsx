"use client";

import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import type { FinanceData } from "@/app/api/finance/route";

interface BenefitItem {
  label: string;
  used: number;
  max: number;
}

function barColor(used: number, max: number): string {
  const pct = max > 0 ? used / max : 0;
  const now = new Date();
  const pastJul1 = now.getMonth() >= 6;
  if (pct > 0.8) return "bg-[#dc2626]";
  if (pct < 0.2 && pastJul1) return "bg-[#dc2626]";
  if (pct >= 0.5) return "bg-[#d97706]";
  return "bg-[#16a34a]";
}

function daysAgo(dateStr: string): string {
  if (!dateStr) return "never";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "unknown";
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  } catch {
    return "unknown";
  }
}

interface Props {
  refreshTrigger?: number;
}

export default function FinancePanel({ refreshTrigger }: Props) {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance");
      const d = await res.json();
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  const benefitGroups: { group: string; items: BenefitItem[] }[] = data
    ? [
        {
          group: "Amex Plat",
          items: [
            { label: "Airline", used: data.benefits.amex_plat.airline, max: 200 },
            { label: "Digital", used: data.benefits.amex_plat.digital, max: 240 },
            { label: "Hotel", used: data.benefits.amex_plat.hotel, max: 200 },
            { label: "Uber", used: data.benefits.amex_plat.uber, max: 200 },
            { label: "Walmart", used: data.benefits.amex_plat.walmart, max: 155 },
            { label: "Saks", used: data.benefits.amex_plat.saks, max: 100 },
          ],
        },
        {
          group: "CSR",
          items: [
            { label: "Travel", used: data.benefits.csr.travel, max: 300 },
          ],
        },
        {
          group: "Delta Reserve",
          items: [
            { label: "Delta Stays", used: data.benefits.delta_reserve.delta_stays, max: 200 },
          ],
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-full">
      {loading && (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af] text-sm">
          Loading&hellip;
        </div>
      )}

      {!loading && (
        <div className="flex-1 overflow-y-auto space-y-4">
          {benefitGroups.map(({ group, items }) => (
            <div key={group}>
              <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">
                {group}
              </div>
              <div className="space-y-2">
                {items.map(({ label, used, max }) => {
                  const pct = max > 0 ? Math.min(used / max, 1) : 0;
                  const color = barColor(used, max);
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-[#6b7280]">{label}</span>
                        <span className="font-mono text-[#6b7280]">${used}/${max}</span>
                      </div>
                      <div className="h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div
                          className={clsx("h-full rounded-full transition-all", color)}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && data && (
        <div className="mt-2 text-[10px] text-[#9ca3af] text-right shrink-0">
          Last updated: {daysAgo(data.last_updated)}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import type { EmailMessage } from "@/app/api/inbox/route";

interface Props {
  onDataLoad?: (msgs: EmailMessage[]) => void;
  refreshTrigger?: number;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "\u2026" : str;
}

function senderName(from: string): string {
  const match = from.match(/^([^<]+)</);
  if (match) return match[1].trim();
  return from.split("@")[0] ?? from;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const diffH = (Date.now() - d.getTime()) / 3_600_000;
    if (diffH < 24) return format(d, "h:mm a");
    if (diffH < 168) return format(d, "EEE");
    return format(d, "MMM d");
  } catch { return ""; }
}

const priorityStyles: Record<string, { bar: string; badge: string; label: string }> = {
  urgent:    { bar: "bg-[#dc2626]", badge: "text-[#dc2626] bg-red-50 border-red-200", label: "STARRED" },
  action:    { bar: "bg-[#d97706]", badge: "text-[#d97706] bg-amber-50 border-amber-200", label: "ACTION" },
  important: { bar: "bg-[#9ca3af]", badge: "text-[#6b7280] bg-gray-100 border-[#e5e7eb]", label: "IMPORTANT" },
};

export default function InboxPanel({ onDataLoad, refreshTrigger }: Props) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data: EmailMessage[] = await fetch("/api/inbox").then((r) => r.json());
      setMessages(data);
      onDataLoad?.(data);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [onDataLoad]);

  useEffect(() => { void load(); }, [load, refreshTrigger]);

  if (loading) return <div className="py-6 text-center text-[#9ca3af] text-sm">Loading&hellip;</div>;
  if (error)   return <div className="py-6 text-center text-[#dc2626] text-sm">Failed to load</div>;
  if (messages.length === 0) return <div className="py-6 text-center text-[#9ca3af] text-sm">Inbox zero</div>;

  return (
    <div className="space-y-1.5">
      {messages.map((msg, i) => {
        const p = priorityStyles[msg.priority ?? "important"];
        return (
          <div
            key={msg.id || i}
            className="flex gap-3 p-2.5 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] hover:bg-white transition-colors"
          >
            <div className={`w-0.5 rounded-full shrink-0 self-stretch ${p.bar}`} />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#111827] truncate">
                  {truncate(senderName(msg.from), 26)}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${p.badge}`}>
                    {p.label}
                  </span>
                  <span className="text-[10px] text-[#9ca3af] font-mono tabular-nums">
                    {formatDate(msg.date)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#6b7280] leading-snug">
                {truncate(msg.subject, 70)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

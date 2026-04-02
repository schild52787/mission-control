"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import type { SchoolEmail } from "@/app/api/school/route";

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "\u2026" : str;
}

function senderShort(from: string): string {
  const match = from.match(/^([^<]+)</);
  const name = match ? match[1].trim() : from;
  return name.replace(/@minnetonkaschools\.org$/i, "").trim();
}

function relativeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return dateStr;
  }
}

const ACTION_RE = /pickup|permission|rsvp|sign|form|late|early|dismissal/i;
const CLOSURE_RE = /no school|closed|non-school|late start/i;

function getFlag(subject: string): string | null {
  if (CLOSURE_RE.test(subject)) return "CLOSURE";
  if (ACTION_RE.test(subject)) return "ACTION";
  return null;
}

interface Props {
  refreshTrigger?: number;
}

export default function SchoolPanel({ refreshTrigger }: Props) {
  const [emails, setEmails] = useState<SchoolEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/school");
      const data = await res.json();
      setEmails(data ?? []);
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#6b7280]">Elle &amp; Luka</span>
        {emails.length > 0 && (
          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-mono border border-orange-200">
            {emails.length} msgs
          </span>
        )}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af] text-sm">
          Loading&hellip;
        </div>
      )}

      {!loading && emails.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af] text-sm">
          All clear
        </div>
      )}

      {!loading && emails.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {emails.map((email, i) => {
            const flag = getFlag(email.subject);
            return (
              <div
                key={email.id || i}
                className="p-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb]"
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-semibold text-[#111827] truncate max-w-[55%]">
                    {senderShort(email.from)}
                  </span>
                  <span className="text-xs text-[#9ca3af] shrink-0 font-mono">
                    {relativeDate(email.date)}
                  </span>
                </div>
                <div className="text-xs text-[#6b7280] mt-0.5 leading-snug">
                  {flag && (
                    <span className={`mr-1 font-bold text-[10px] shrink-0 ${
                      flag === "CLOSURE" ? "text-[#d97706]" : "text-[#dc2626]"
                    }`}>
                      {flag}
                    </span>
                  )}
                  {truncate(email.subject, 45)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

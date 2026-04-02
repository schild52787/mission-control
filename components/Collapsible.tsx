"use client";

import { useState, useEffect } from "react";

interface Props {
  id: string;
  title: string;
  badge?: string;
  badgeColor?: "green" | "cyan" | "amber" | "red" | "slate";
  defaultOpen?: boolean;
  accentColor?: string;
  children: React.ReactNode;
}

const badgeStyles: Record<string, string> = {
  green: "bg-green-50 text-[#16a34a] border-green-200",
  cyan: "bg-blue-50 text-[#2563eb] border-blue-200",
  amber: "bg-amber-50 text-[#d97706] border-amber-200",
  red: "bg-red-50 text-[#dc2626] border-red-200",
  slate: "bg-gray-100 text-[#6b7280] border-[#e5e7eb]",
};

export default function Collapsible({
  id,
  title,
  badge,
  badgeColor = "slate",
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(`mc-section-${id}`);
    if (stored !== null) setOpen(stored === "true");
  }, [id]);

  useEffect(() => {
    if (mounted) localStorage.setItem(`mc-section-${id}`, String(open));
  }, [open, id, mounted]);

  return (
    <section className="bg-white border border-[#e5e7eb] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#f9fafb] transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#6b7280]">
            {title}
          </span>
          {badge && (
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${badgeStyles[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-[#9ca3af] group-hover:text-[#6b7280] transition-all duration-200 ${open ? "" : "-rotate-90"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && <div className="px-5 pb-4">{children}</div>}
    </section>
  );
}

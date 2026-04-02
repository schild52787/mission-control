"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface MemoryEntry {
  filename: string;
  date: string | null;
  preview: string;
  content: string;
}

function formatDateLabel(date: string | null): string {
  if (!date) return "Long-term Memory";
  try {
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return date;
  }
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <p key={key++} className="text-xs font-bold text-[#2563eb] tracking-widest uppercase mt-4 mb-1">
          {line.slice(3)}
        </p>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <p key={key++} className="text-sm font-bold text-[#111827] tracking-wide mt-4 mb-1">
          {line.slice(2)}
        </p>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <p key={key++} className="text-xs font-semibold text-[#111827] mt-3 mb-1">
          {line.slice(4)}
        </p>
      );
    } else if (line.match(/^[-*+]\s/)) {
      elements.push(
        <li key={key++} className="text-sm text-[#6b7280] leading-relaxed ml-4 list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      elements.push(
        <p key={key++} className="text-sm text-[#6b7280] leading-relaxed">
          {line}
        </p>
      );
    }
  }

  return elements;
}

export default function MemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [selected, setSelected] = useState<MemoryEntry | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/memory");
      const data: MemoryEntry[] = await res.json();
      setEntries(data);
      if (data.length > 0 && !selected) {
        setSelected(data[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = search
    ? entries.filter(
        (e) =>
          e.content.toLowerCase().includes(search.toLowerCase()) ||
          e.filename.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111827] flex flex-col">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/" className="text-xs text-[#6b7280] hover:text-[#2563eb] transition-colors flex items-center gap-1.5">
            &larr; Mission Control
          </Link>
          <span className="text-[#e5e7eb]">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
            <span className="text-xs font-semibold tracking-[0.05em] text-[#111827] uppercase">Memory Browser</span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 pb-16">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-[#9ca3af]">
            Loading memory&hellip;
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 h-full">
            <div className="w-full md:w-1/3 flex flex-col gap-3 shrink-0">
              <input
                type="text"
                placeholder="Search memory\u2026"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              />

              <div className="flex flex-col gap-1">
                {filtered.map((entry) => {
                  const isMain = entry.filename === "MEMORY.md";
                  const isSelected = selected?.filename === entry.filename;
                  return (
                    <button
                      key={entry.filename}
                      onClick={() => setSelected(entry)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                        isSelected
                          ? "bg-blue-50 border-[#2563eb]"
                          : "border-transparent hover:bg-[#f9fafb] hover:border-[#e5e7eb]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        {isMain ? (
                          <span className="text-xs font-semibold text-[#2563eb]">Long-term Memory</span>
                        ) : (
                          <span className="text-xs font-semibold text-[#111827]">{formatDateLabel(entry.date)}</span>
                        )}
                        {isMain && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2563eb]">
                            pinned
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9ca3af] leading-snug line-clamp-2">{entry.preview}</p>
                    </button>
                  );
                })}

                {filtered.length === 0 && (
                  <p className="text-sm text-[#9ca3af] italic px-3">No entries match your search</p>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {selected ? (
                <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e5e7eb]">
                    <div>
                      <h2 className="text-sm font-bold text-[#111827]">
                        {selected.filename === "MEMORY.md" ? "Long-term Memory" : formatDateLabel(selected.date)}
                      </h2>
                      <p className="text-[10px] text-[#9ca3af] font-mono mt-0.5">
                        {selected.filename} &middot; {wordCount(selected.content).toLocaleString()} words
                      </p>
                    </div>
                    {selected.date && (
                      <span className="text-[10px] text-[#9ca3af] font-mono">{selected.date}</span>
                    )}
                  </div>
                  <div className="space-y-0.5 max-h-[65vh] overflow-y-auto pr-2">
                    {renderContent(selected.content)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-[#9ca3af] text-sm">
                  Select a file to view
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

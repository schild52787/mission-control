"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Proposal {
  id: string;
  category: string;
  emoji: string;
  title: string;
  description: string;
  stack: string[];
  effort: "low" | "medium" | "high";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  decidedAt?: string;
}

type Status = "pending" | "accepted" | "rejected";

const COLUMNS: { status: Status; label: string; color: string; headerBg: string; headerText: string }[] = [
  { status: "pending", label: "Proposed", color: "#2563eb", headerBg: "bg-blue-50", headerText: "text-[#2563eb]" },
  { status: "accepted", label: "Accepted", color: "#16a34a", headerBg: "bg-green-50", headerText: "text-[#16a34a]" },
  { status: "rejected", label: "Rejected", color: "#dc2626", headerBg: "bg-red-50", headerText: "text-[#dc2626]" },
];

const effortConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  low: { label: "Low", bg: "bg-green-50", text: "text-[#16a34a]", border: "border-green-200" },
  medium: { label: "Medium", bg: "bg-amber-50", text: "text-[#d97706]", border: "border-amber-200" },
  high: { label: "High", bg: "bg-red-50", text: "text-[#dc2626]", border: "border-red-200" },
};

const categoryConfig: Record<string, { bg: string; text: string; border: string }> = {
  work: { bg: "bg-blue-50", text: "text-[#2563eb]", border: "border-blue-200" },
  personal: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  health: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  family: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
};

export default function ProposalsKanban() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const dragIdRef = useRef(dragId);
  dragIdRef.current = dragId;

  const load = useCallback(async () => {
    try {
      const data: Proposal[] = await fetch("/api/proposals").then((r) => r.json());
      setProposals(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = useCallback(async (id: string, status: Status) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, decidedAt: status !== "pending" ? new Date().toISOString().slice(0, 10) : undefined } : p))
    );
    try {
      await fetch("/api/proposals/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      await load();
    }
  }, [load]);

  const handleDelete = useCallback(async (id: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
    try {
      await fetch("/api/proposals/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, deleted: true }),
      });
    } catch {
      await load();
    }
  }, [load]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    requestAnimationFrame(() => {
      const el = document.getElementById(`card-${id}`);
      if (el) el.style.opacity = "0.5";
    });
  }, []);

  const onDragEnd = useCallback(() => {
    if (dragIdRef.current) {
      const el = document.getElementById(`card-${dragIdRef.current}`);
      if (el) el.style.opacity = "1";
    }
    setDragId(null);
    setDragOver(null);
  }, []);

  const onDragOverColumn = useCallback((e: React.DragEvent, status: Status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(status);
  }, []);

  const onDragLeaveColumn = useCallback(() => {
    setDragOver(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent, targetStatus: Status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      const proposal = proposals.find((p) => p.id === id);
      if (proposal && proposal.status !== targetStatus) {
        void updateStatus(id, targetStatus);
      }
    }
    setDragOver(null);
    setDragId(null);
  }, [proposals, updateStatus]);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: proposals.filter((p) => p.status === col.status),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[#9ca3af] text-sm animate-pulse">Loading proposals&hellip;</div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 min-h-[calc(100vh-120px)] items-start">
      {grouped.map((col) => (
        <div
          key={col.status}
          className={`flex-1 min-w-[280px] rounded-xl border transition-all duration-200 ${
            dragOver === col.status
              ? "border-2 shadow-lg"
              : "border-[#e5e7eb]"
          }`}
          style={{
            borderColor: dragOver === col.status ? col.color : undefined,
            backgroundColor: dragOver === col.status ? `${col.color}08` : "#fafafa",
          }}
          onDragOver={(e) => onDragOverColumn(e, col.status)}
          onDragLeave={onDragLeaveColumn}
          onDrop={(e) => onDrop(e, col.status)}
        >
          {/* Column Header */}
          <div className={`px-4 py-3 rounded-t-xl ${col.headerBg} border-b border-[#e5e7eb]`}>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: col.color }}
              />
              <span className={`text-sm font-bold ${col.headerText}`}>{col.label}</span>
              <span
                className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full`}
                style={{ backgroundColor: `${col.color}15`, color: col.color }}
              >
                {col.items.length}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="p-3 space-y-2.5 min-h-[200px]">
            {col.items.length === 0 && (
              <div className="text-center text-xs text-[#9ca3af] py-8">
                {dragId ? "Drop here" : "No proposals"}
              </div>
            )}
            {col.items.map((p) => {
              const effort = effortConfig[p.effort] || effortConfig.medium;
              const cat = categoryConfig[p.category] || categoryConfig.work;
              const isRejected = p.status === "rejected";
              const isExpanded = expanded.has(p.id);

              return (
                <div
                  key={p.id}
                  id={`card-${p.id}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, p.id)}
                  onDragEnd={onDragEnd}
                  className={`group relative bg-white rounded-lg border border-[#e5e7eb] p-3.5 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    isRejected ? "opacity-55" : ""
                  } ${dragId === p.id ? "shadow-xl scale-[1.02]" : ""}`}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                    className="absolute top-2.5 right-7 text-[#9ca3af] hover:text-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity text-sm w-5 h-5 flex items-center justify-center rounded hover:bg-red-50"
                    title="Remove proposal"
                  >
                    &times;
                  </button>

                  {/* Drag handle */}
                  <div className="absolute top-3 right-2.5 text-[#d1d5db] opacity-0 group-hover:opacity-100 transition-opacity text-sm select-none pointer-events-none">
                    &#10303;
                  </div>

                  {/* Confirm delete overlay */}
                  {confirmDeleteId === p.id && (
                    <div className="absolute inset-0 bg-white/95 rounded-lg flex items-center justify-center gap-3 z-10 border border-red-200">
                      <span className="text-xs font-medium text-[#111827]">Remove?</span>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs font-bold text-white bg-[#dc2626] hover:bg-red-700 px-2.5 py-1 rounded transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs font-medium text-[#6b7280] hover:text-[#111827] px-2 py-1 rounded border border-[#e5e7eb] transition-colors"
                      >
                        No
                      </button>
                    </div>
                  )}

                  {/* Title row */}
                  <div className="flex items-start gap-2 pr-5">
                    <span className="text-lg leading-none shrink-0">{p.emoji}</span>
                    <p className="text-[15px] font-bold text-[#111827] leading-snug">{p.title}</p>
                  </div>

                  {/* Description */}
                  <div
                    className="mt-2 cursor-pointer"
                    onClick={() => toggleExpand(p.id)}
                  >
                    <p className={`text-xs text-[#6b7280] leading-relaxed ${
                      isExpanded ? "" : "line-clamp-2"
                    }`}>
                      {p.description}
                    </p>
                    {!isExpanded && p.description.length > 100 && (
                      <span className="text-[10px] text-[#9ca3af] hover:text-[#6b7280]">show more</span>
                    )}
                  </div>

                  {/* Stack tags */}
                  {p.stack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {p.stack.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                      {p.category}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${effort.bg} ${effort.text} ${effort.border}`}>
                      {effort.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

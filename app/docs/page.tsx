"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Category = "travel" | "work" | "fitness" | "planning" | "general";

interface Doc {
  id: string;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  format: string;
  createdAt: string;
}

const CATEGORIES: { key: Category | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "travel", label: "Travel" },
  { key: "work", label: "Work" },
  { key: "fitness", label: "Fitness" },
  { key: "planning", label: "Planning" },
  { key: "general", label: "General" },
];

const CATEGORY_STYLES: Record<Category, string> = {
  travel: "text-purple-600 bg-purple-50 border-purple-200",
  work: "text-[#2563eb] bg-blue-50 border-blue-200",
  fitness: "text-[#16a34a] bg-green-50 border-green-200",
  planning: "text-[#d97706] bg-amber-50 border-amber-200",
  general: "text-[#6b7280] bg-gray-100 border-[#e5e7eb]",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function DocCard({ doc, onClick }: { doc: Doc; onClick: () => void }) {
  const preview = doc.content.length > 150 ? doc.content.slice(0, 150) + "\u2026" : doc.content;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-[#e5e7eb] bg-white hover:border-[#2563eb] hover:shadow-sm transition-all duration-150 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#111827] leading-snug">{doc.title}</h3>
        <span className={`inline-flex text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border shrink-0 ${CATEGORY_STYLES[doc.category]}`}>
          {doc.category.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-[#6b7280] leading-snug">{preview}</p>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-wrap gap-1">
          {doc.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[9px] font-mono text-[#9ca3af] bg-[#f9fafb] px-1.5 py-0.5 rounded">{tag}</span>
          ))}
        </div>
        <span className="text-[10px] text-[#9ca3af] font-mono shrink-0">{formatDate(doc.createdAt)}</span>
      </div>
    </button>
  );
}

function DocModal({ doc, onClose, onDelete }: { doc: Doc; onClose: () => void; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    setDeleting(true);
    await fetch(`/api/docs?id=${doc.id}`, { method: "DELETE" });
    onDelete(doc.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 max-w-2xl w-full shadow-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-bold text-[#111827]">{doc.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border ${CATEGORY_STYLES[doc.category]}`}>
                {doc.category.toUpperCase()}
              </span>
              <span className="text-[10px] text-[#9ca3af] font-mono">{formatDate(doc.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#111827] text-lg leading-none shrink-0">&times;</button>
        </div>

        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {doc.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-mono text-[#6b7280] bg-[#f9fafb] px-2 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto border-t border-[#e5e7eb] pt-4 mb-4">
          <pre className="text-sm text-[#6b7280] leading-relaxed whitespace-pre-wrap font-sans">{doc.content}</pre>
        </div>

        <div className="flex items-center gap-2 border-t border-[#e5e7eb] pt-4">
          <button onClick={handleCopy} className="px-3 py-1.5 text-xs font-semibold border border-[#e5e7eb] text-[#6b7280] hover:text-[#2563eb] hover:border-[#2563eb] rounded-lg transition-colors">
            {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
            {deleting ? "Deleting\u2026" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewDocModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, tags, format: "text" }),
      });
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white border border-[#e5e7eb] rounded-lg p-6 max-w-lg w-full shadow-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#111827]">New Document</h2>
          <button type="button" onClick={onClose} className="text-[#9ca3af] hover:text-[#111827] text-lg">&times;</button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto">
          <div>
            <label className="block text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase mb-1">Title</label>
            <input
              className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
              placeholder="Document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase mb-1">Category</label>
              <select
                className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#2563eb]"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase mb-1">Tags (comma-separated)</label>
              <input
                className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                placeholder="tag1, tag2"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase mb-1">Content</label>
            <textarea
              className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] resize-none"
              placeholder="Document content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#e5e7eb]">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#111827] border border-[#e5e7eb] hover:border-[#9ca3af] rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !title.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 rounded-lg transition-colors">
            {saving ? "Saving\u2026" : "Save Doc"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [showNewDoc, setShowNewDoc] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      const res = await fetch(`/api/docs?${params}`);
      const data: Doc[] = await res.json();
      setDocs(data);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  function handleDelete(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111827]">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-[#6b7280] hover:text-[#2563eb] transition-colors flex items-center gap-1.5">
              &larr; Mission Control
            </Link>
            <span className="text-[#e5e7eb]">|</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d97706]" />
              <span className="text-xs font-semibold tracking-[0.05em] text-[#111827] uppercase">Docs</span>
            </div>
          </div>
          <button
            onClick={() => setShowNewDoc(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors"
          >
            + New Doc
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search docs\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
          />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key as Category | "all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                  category === cat.key
                    ? "bg-blue-50 border-[#2563eb] text-[#2563eb]"
                    : "border-[#e5e7eb] text-[#9ca3af] hover:text-[#111827] hover:border-[#9ca3af]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-[#9ca3af]">Loading docs&hellip;</div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <p className="text-[#9ca3af] text-sm">No docs yet &mdash; I will save documents here automatically</p>
            <button onClick={() => setShowNewDoc(true)} className="text-xs text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
              + Create your first doc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {docs.map((doc) => (
              <DocCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} />
            ))}
          </div>
        )}
      </main>

      {selectedDoc && <DocModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} onDelete={handleDelete} />}
      {showNewDoc && <NewDocModal onClose={() => setShowNewDoc(false)} onCreated={load} />}
    </div>
  );
}

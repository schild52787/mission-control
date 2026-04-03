"use client";

import { useEffect, useState, useCallback } from "react";
import type { NewsFeedResponse } from "@/app/api/news-feed/route";

const POLL_INTERVAL_MS = 60 * 60 * 1000;

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  return `${h}h ago`;
}

export default function NewsPanel() {
  const [data, setData] = useState<NewsFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/news-feed");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const showStaleMessage = !loading && (data?.missing || data?.stale);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        {data?.generatedAt && !data.missing && (
          <span className="text-[10px] text-[#9ca3af] font-mono">
            Last updated {timeAgo(data.generatedAt)}
          </span>
        )}
        {showStaleMessage && (
          <span className="text-[10px] text-[#9ca3af] font-mono">
            No briefing yet &mdash; runs at 6:30am and 5:30pm
          </span>
        )}
      </div>

      <div
        className="overflow-y-auto scroll-smooth space-y-2 pr-1"
        style={{ height: "320px" }}
      >
        {loading && (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
                <div className="w-6 h-6 bg-[#e5e7eb] rounded shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#e5e7eb] rounded w-4/5" />
                  <div className="h-2.5 bg-[#e5e7eb] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (data?.items ?? []).length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-[#9ca3af]">
            No briefing yet &mdash; runs at 6:30am and 5:30pm
          </div>
        )}

        {(data?.items ?? []).map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg border border-[#e5e7eb] bg-white hover:border-[#2563eb] hover:shadow-sm transition-all duration-150 group"
          >
            <div className="w-6 h-6 rounded shrink-0 overflow-hidden bg-[#f3f4f6] flex items-center justify-center mt-0.5">
              {item.sourceDomain ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://www.google.com/s2/favicons?domain=${item.sourceDomain}&sz=32`}
                  alt={item.source}
                  width={16}
                  height={16}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-sm">{item.sectionEmoji}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#111827] leading-snug group-hover:text-[#2563eb] transition-colors line-clamp-2">
                {item.headline}
              </p>

              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-[#9ca3af] font-mono">{item.source}</span>
                <span className="text-[10px] text-[#9ca3af]">&middot;</span>
                <span className="text-[10px] text-[#9ca3af] font-mono">{item.publishedAgo}</span>
                <div className="ml-auto flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span
                      key={j}
                      className={`text-[9px] ${j < item.rating ? "text-[#d97706]" : "text-[#e5e7eb]"}`}
                    >
                      &#9733;
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

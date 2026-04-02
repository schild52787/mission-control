"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface NavItem {
  id: string;
  label: string;
  href?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "daily-summary", label: "Daily Summary" },
    ],
  },
  {
    label: "WORK",
    items: [
      { id: "projects", label: "Projects" },
      { id: "proposals", label: "Proposals" },
      { id: "tasks", label: "Tasks", href: "/tasks" },
      { id: "actions", label: "Actions" },
    ],
  },
  {
    label: "LIFE",
    items: [
      { id: "calendar", label: "Calendar / Schedule", href: "/schedule" },
      { id: "trips", label: "Travel & Trips" },
      { id: "mom-flights", label: "Mom's Flights", href: "/mom-travel" },
      { id: "school", label: "School" },
    ],
  },
  {
    label: "FINANCE",
    items: [{ id: "finance", label: "Finance" }],
  },
  {
    label: "HEALTH",
    items: [{ id: "workouts", label: "Workouts" }],
  },
  {
    label: "LINKS & TOOLS",
    items: [
      { id: "quick-links", label: "Quick Links" },
      { id: "memory", label: "Memory", href: "/memory" },
    ],
  },
];

interface SidebarProps {
  activeSection: string;
  onNavigate: (id: string) => void;
  lastRefreshed: Date | null;
  onRefresh: () => void;
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="px-3 pb-4">
      <div className="text-xs font-mono text-[#9ca3af] tabular-nums">{time}</div>
      <div className="text-[11px] text-[#9ca3af]">{date}</div>
    </div>
  );
}

export default function Sidebar({ activeSection, onNavigate, lastRefreshed, onRefresh }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = useCallback((item: NavItem) => {
    onNavigate(item.id);
    setMobileOpen(false);
  }, [onNavigate]);

  // Close mobile sidebar on resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Wordmark */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-bold text-[#111827]">Mission Control</span>
          <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse" />
        </div>
      </div>

      {/* Clock */}
      <LiveClock />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#9ca3af] px-3 pt-4 pb-1">
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = activeSection === item.id;
              if (item.href && item.id === "tasks") {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition-colors ${
                      isActive
                        ? "bg-[#eff6ff] text-[#2563eb] border-l-[3px] border-[#2563eb] font-medium"
                        : "text-[#111827] hover:bg-[#f3f4f6] border-l-[3px] border-transparent"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition-colors text-left ${
                    isActive
                      ? "bg-[#eff6ff] text-[#2563eb] border-l-[3px] border-[#2563eb] font-medium"
                      : "text-[#111827] hover:bg-[#f3f4f6] border-l-[3px] border-transparent"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: refresh */}
      <div className="px-3 py-3 border-t border-[#e5e7eb]">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 text-xs text-[#6b7280] hover:text-[#2563eb] transition-colors"
        >
          <span>&#8635; Refresh</span>
        </button>
        {lastRefreshed && (
          <span className="text-[10px] text-[#9ca3af] font-mono mt-1 block">
            Last: {lastRefreshed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-white border border-[#e5e7eb] rounded-lg p-2 shadow-sm"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-[#111827]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute left-0 top-0 bottom-0 w-[240px] bg-white border-r border-[#e5e7eb] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 text-[#6b7280] hover:text-[#111827]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-[#e5e7eb] flex-col z-30">
        {sidebarContent}
      </aside>
    </>
  );
}

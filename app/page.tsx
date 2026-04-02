"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import ProjectsPanel from "@/components/ProjectsPanel";
import ActionsPanel from "@/components/ActionsPanel";
import DailySummaryPanel from "@/components/DailySummaryPanel";
import ProposalsPanel from "@/components/ProposalsPanel";
import MomFlightsWidget from "@/components/MomFlightsWidget";
import CalendarPanel from "@/components/CalendarPanel";
import FinancePanel from "@/components/FinancePanel";
import LinksPanel from "@/components/LinksPanel";
import TripsPanel from "@/components/TripsPanel";
import SchoolPanel from "@/components/SchoolPanel";
import WorkoutPanel from "@/components/WorkoutPanel";
import ClockWidget from "@/components/ClockWidget";
import type { CalendarEvent } from "@/app/api/calendar/route";

const REFRESH_MS = 5 * 60 * 1000;

const SECTION_IDS = [
  "dashboard",
  "daily-summary",
  "projects",
  "proposals",
  "actions",
  "calendar",
  "trips",
  "mom-flights",
  "school",
  "finance",
  "workouts",
  "quick-links",
  "memory",
];

export default function MissionControlPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const mainRef = useRef<HTMLDivElement>(null);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((n) => n + 1);
    setLastRefreshed(new Date());
  }, []);

  useEffect(() => {
    const id = setInterval(triggerRefresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [triggerRefresh]);

  // Intersection observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const handleNavigate = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Brief highlight
      el.classList.add("ring-2", "ring-blue-200");
      setTimeout(() => el.classList.remove("ring-2", "ring-blue-200"), 1500);
    }
  }, []);

  // Stat counts
  const openTasks = 0; // placeholder - loaded dynamically if needed
  const upcomingTrips = 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#111827]">
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        lastRefreshed={lastRefreshed}
        onRefresh={triggerRefresh}
      />

      {/* Main content */}
      <main ref={mainRef} className="md:ml-[240px] p-6 md:p-8">
        {/* Page title */}
        <section id="dashboard" className="mb-8">
          <h1 className="text-[20px] font-semibold text-[#111827] mb-6">Dashboard</h1>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card">
              <div className="text-[12px] font-medium text-[#9ca3af] uppercase tracking-wide">Projects Active</div>
              <div className="text-2xl font-bold text-[#111827] mt-1">13</div>
            </div>
            <div className="stat-card">
              <div className="text-[12px] font-medium text-[#9ca3af] uppercase tracking-wide">Tasks Open</div>
              <div className="text-2xl font-bold text-[#111827] mt-1">&mdash;</div>
            </div>
            <div className="stat-card">
              <div className="text-[12px] font-medium text-[#9ca3af] uppercase tracking-wide">Proposals Pending</div>
              <div className="text-2xl font-bold text-[#111827] mt-1">&mdash;</div>
            </div>
            <div className="stat-card">
              <div className="text-[12px] font-medium text-[#9ca3af] uppercase tracking-wide">Trips Upcoming</div>
              <div className="text-2xl font-bold text-[#111827] mt-1">&mdash;</div>
            </div>
          </div>
        </section>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left column (wider) */}
          <div className="xl:col-span-3 space-y-6">
            <section id="daily-summary" className="card transition-all duration-300">
              <h2 className="section-header">Daily Summary</h2>
              <DailySummaryPanel refreshTrigger={refreshTrigger} />
            </section>

            <section id="projects" className="card transition-all duration-300">
              <h2 className="section-header">Projects</h2>
              <ProjectsPanel />
            </section>

            <section id="proposals" className="card transition-all duration-300">
              <h2 className="section-header">Proposals</h2>
              <ProposalsPanel />
            </section>

            <section id="actions" className="card transition-all duration-300">
              <h2 className="section-header">Actions</h2>
              <ActionsPanel />
            </section>

            <section id="calendar" className="card transition-all duration-300">
              <h2 className="section-header">Calendar / Schedule</h2>
              <CalendarPanel
                onDataLoad={setCalendarEvents}
                refreshTrigger={refreshTrigger}
              />
            </section>

            <section id="trips" className="card transition-all duration-300">
              <h2 className="section-header">Travel &amp; Trips</h2>
              <TripsPanel allEvents={calendarEvents} />
            </section>

            <section id="school" className="card transition-all duration-300">
              <h2 className="section-header">School</h2>
              <SchoolPanel refreshTrigger={refreshTrigger} />
            </section>

            <section id="finance" className="card transition-all duration-300">
              <h2 className="section-header">Finance</h2>
              <FinancePanel refreshTrigger={refreshTrigger} />
            </section>

            <section id="workouts" className="card transition-all duration-300">
              <h2 className="section-header">Workouts</h2>
              <WorkoutPanel refreshTrigger={refreshTrigger} />
            </section>
          </div>

          {/* Right column */}
          <div className="xl:col-span-2 space-y-6">
            <div className="card transition-all duration-300">
              <ClockWidget />
            </div>

            <section id="mom-flights" className="card transition-all duration-300">
              <h2 className="section-header">Mom&apos;s Flights</h2>
              <MomFlightsWidget />
            </section>

            <section id="quick-links" className="card transition-all duration-300">
              <h2 className="section-header">Quick Links</h2>
              <LinksPanel />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

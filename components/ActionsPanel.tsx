"use client";

type Priority = "high" | "medium" | "low";

interface Action {
  id: string;
  priority: Priority;
  title: string;
  detail: string;
  url?: string;
  urlLabel?: string;
  deadline?: string;
}

const ACTIONS: Action[] = [
  {
    id: "gateway-fix",
    priority: "high",
    title: "Fix OpenClaw Gateway",
    detail: "Gateway token mismatch blocks sub-agent spawning + push alerts. Run this on Mac Mini:",
  },
  {
    id: "chrome-extension",
    priority: "high",
    title: "Attach Chrome Extension (Browser Relay)",
    detail: "Required for Points Monitor live award scraping \u2014 Delta, Amex, AwardFares. Click OpenClaw toolbar icon on a tab to attach.",
  },
  {
    id: "melissa-choices",
    priority: "high",
    title: "Melissa: Select 2 Remaining Diamond Choice Benefits",
    detail: "1/3 used ($700 Amex credit). Recommendation: 4 GUCs + $500 Delta Vacations credit. Select in Fly Delta app.",
    urlLabel: "Fly Delta app",
    deadline: "Jan 31, 2027",
  },
  {
    id: "italy-route",
    priority: "medium",
    title: "Italy Route Decision \u2014 Melissa Picks A, B, or C",
    detail: "Brochure is live. Once she picks, hotels can be booked. Aug 12\u201326 flights confirmed (GIXFOB).",
    url: "https://schild52787.github.io/italy-2026/",
    urlLabel: "View Italy Brochure",
  },
  {
    id: "felice-booking",
    priority: "medium",
    title: "Book Felice a Testaccio \u2014 Rome",
    detail: "August fills weeks in advance. Book directly via feliceatestaccio.com ASAP.",
    url: "https://feliceatestaccio.com",
    urlLabel: "feliceatestaccio.com",
    deadline: "ASAP",
  },
  {
    id: "amalfi-boat",
    priority: "medium",
    title: "Book Amalfi Coast Boat Charter",
    detail: "Private charter \u20AC839\u20131,049 from Marina Piccola, Sorrento. 2026 peak season books out early.",
    url: "https://sorrentoinsider.com/boat-tours",
    urlLabel: "sorrentoinsider.com",
    deadline: "ASAP",
  },
  {
    id: "companion-certs",
    priority: "medium",
    title: "Check Companion Cert Expiration Dates",
    detail: "Kyle: Delta Platinum Amex cert. Melissa: Delta Reserve Amex cert. Both valid US/Caribbean/Central America. Check expiry in each app.",
  },
  {
    id: "points-routes",
    priority: "low",
    title: "Points Monitor: Confirm Routes to Watch",
    detail: "MSP\u2192CUN + MSP\u2192MCO pre-loaded. Add others? (SJD, MBJ, PUJ?) Confirm school break trip timing: Winter break Dec 23\u2013Jan 4, Spring break Mar 29\u2013Apr 5.",
  },
  {
    id: "adderall-dr",
    priority: "low",
    title: "Schedule Doctor Appointment \u2014 Adderall Efficacy",
    detail: "50mg/day losing efficacy over last 6 months. Worth discussing with prescriber.",
  },
];

const priorityConfig: Record<Priority, { dot: string; border: string }> = {
  high: { dot: "bg-[#dc2626]", border: "border-l-[#dc2626]" },
  medium: { dot: "bg-[#d97706]", border: "border-l-[#d97706]" },
  low: { dot: "bg-[#9ca3af]", border: "border-l-[#9ca3af]" },
};

const GATEWAY_CMD =
  "launchctl bootout gui/$UID/ai.openclaw.gateway && sleep 2 && launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.gateway.plist";

export default function ActionsPanel() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] font-mono text-[#dc2626]">
          {ACTIONS.filter((a) => a.priority === "high").length} high priority
        </span>
      </div>

      <div className="space-y-2">
        {ACTIONS.map((action) => {
          const cfg = priorityConfig[action.priority];
          return (
            <div
              key={action.id}
              className={`p-3 rounded-lg border border-[#e5e7eb] bg-white border-l-[3px] ${cfg.border}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#111827] leading-tight">
                      {action.title}
                    </p>
                    {action.deadline && (
                      <span className="text-[10px] font-mono text-[#d97706] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                        &#9201; {action.deadline}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                    {action.detail}
                  </p>

                  {action.id === "gateway-fix" && (
                    <code className="block mt-2 text-[10px] font-mono text-[#111827] bg-[#f9fafb] border border-[#e5e7eb] rounded px-2.5 py-1.5 leading-relaxed break-all">
                      {GATEWAY_CMD}
                    </code>
                  )}

                  {action.url && (
                    <a
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                    >
                      {action.urlLabel ?? action.url} &#8599;
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

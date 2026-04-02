"use client";

const LOCAL_IP = "mac-mini.tail428633.ts.net";

const BUILDS = [
  { emoji: "\u{1F3E0}", label: "Mission Control", desc: "This dashboard", url: `http://${LOCAL_IP}:3000` },
  { emoji: "\u{1F4AA}", label: "FitTrack", desc: "Injury-safe workouts", url: `http://${LOCAL_IP}:3001` },
  { emoji: "\u{1F4DA}", label: "Elle & Luka", desc: "Kids learning app", url: `http://${LOCAL_IP}:3002` },
  { emoji: "\u{1F4B3}", label: "Card Optimizer", desc: "Rewards maximizer", url: `http://${LOCAL_IP}:3003` },
];

const LINKS = [
  { emoji: "\u{1F4E7}", label: "Gmail", url: "https://mail.google.com" },
  { emoji: "\u{1F4C5}", label: "Calendar", url: "https://calendar.google.com" },
  { emoji: "\u2708\uFE0F", label: "Delta", url: "https://delta.com" },
  { emoji: "\u{1F4B3}", label: "Amex", url: "https://americanexpress.com" },
  { emoji: "\u{1F3E6}", label: "Chase", url: "https://chase.com" },
  { emoji: "\u{1F3C6}", label: "AwardWallet", url: "https://awardwallet.com" },
  { emoji: "\u{1F3E8}", label: "IHG", url: "https://ihg.com" },
  { emoji: "\u{1F4AA}", label: "Life Time", url: "https://lifetime.life" },
  { emoji: "\u{1F916}", label: "Claude", url: "https://claude.ai" },
  { emoji: "\u{1F324}\uFE0F", label: "Weather", url: "https://wttr.in/MSP" },
  { emoji: "\u2705", label: "Things 3", url: "things:///" },
  { emoji: "\u{1F6EB}", label: "Google Flights", url: "https://flights.google.com" },
];

export default function LinksPanel() {
  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {/* Local Apps */}
      <div>
        <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">
          Local Apps
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {BUILDS.map(({ emoji, label, desc, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-0.5 px-2.5 py-2 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] hover:border-[#2563eb] hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">{emoji}</span>
                <span className="text-xs font-semibold text-[#111827] group-hover:text-[#2563eb] transition-colors">
                  {label}
                </span>
              </div>
              <span className="text-[10px] text-[#9ca3af] truncate">{desc}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex-1">
        <div className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">
          Bookmarks
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LINKS.map(({ emoji, label, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] hover:border-[#2563eb] hover:bg-blue-50 transition-all group"
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="text-xs text-[#111827] group-hover:text-[#2563eb] transition-colors font-medium truncate">
                {label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

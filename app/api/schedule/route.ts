import { NextResponse } from "next/server";
import { execSync } from "child_process";

interface LaunchAgent {
  label: string;
  command: string;
  schedule: string;
  runAtLoad: boolean;
}

interface CronJob {
  schedule: string;
  command: string;
}

function intervalToReadable(seconds: number): string {
  if (seconds === 3600) return "hourly";
  if (seconds === 10800) return "every 3h";
  if (seconds === 86400) return "daily";
  if (seconds < 60) return `every ${seconds}s`;
  if (seconds < 3600) return `every ${Math.round(seconds / 60)}m`;
  return `every ${Math.round(seconds / 3600)}h`;
}

interface CalendarInterval {
  Hour?: number;
  Minute?: number;
  Weekday?: number;
}

function calendarIntervalToReadable(ci: CalendarInterval | CalendarInterval[]): string {
  const item = Array.isArray(ci) ? ci[0] : ci;
  if (!item) return "scheduled";
  const h = item.Hour ?? 0;
  const m = item.Minute ?? 0;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const min = String(m).padStart(2, "0");
  return `daily at ${hour12}:${min} ${ampm}`;
}

interface PlistData {
  Label?: string;
  ProgramArguments?: string[];
  StartInterval?: number;
  StartCalendarInterval?: CalendarInterval | CalendarInterval[];
  RunAtLoad?: boolean;
}

function parseLaunchAgents(): LaunchAgent[] {
  try {
    const lsOut = execSync(
      "ls /Users/kyleschildkraut/Library/LaunchAgents/ai.claw.*.plist 2>/dev/null",
      { encoding: "utf-8" }
    ).trim();

    if (!lsOut) return [];

    const files = lsOut.split("\n").filter(Boolean);
    const agents: LaunchAgent[] = [];

    for (const file of files) {
      try {
        const jsonOut = execSync(`plutil -convert json -o - "${file}"`, {
          encoding: "utf-8",
        });
        const data = JSON.parse(jsonOut) as PlistData;

        const label = data.Label ?? file;
        const args = data.ProgramArguments ?? [];
        const command = args.join(" ");

        let schedule = "on demand";
        if (data.StartInterval) {
          schedule = intervalToReadable(data.StartInterval);
        } else if (data.StartCalendarInterval) {
          schedule = calendarIntervalToReadable(data.StartCalendarInterval);
        }

        agents.push({
          label,
          command,
          schedule,
          runAtLoad: data.RunAtLoad ?? false,
        });
      } catch {
        // Skip malformed plist
      }
    }

    return agents;
  } catch {
    return [];
  }
}

function parseCronJobs(): CronJob[] {
  try {
    const out = execSync("crontab -l 2>/dev/null", {
      encoding: "utf-8",
    }).trim();

    if (!out) return [];

    return out
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        const schedule = parts.slice(0, 5).join(" ");
        const command = parts.slice(5).join(" ");
        return { schedule, command };
      });
  } catch {
    return [];
  }
}

export async function GET() {
  const launchAgents = parseLaunchAgents();
  const cronJobs = parseCronJobs();
  return NextResponse.json({ launchAgents, cronJobs });
}

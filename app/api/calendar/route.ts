import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CalendarEvent {
  id: string;
  start: string;
  end: string;
  summary: string;
}

export async function GET() {
  try {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const fromISO = now.toISOString();
    const toISO = in48h.toISOString();

    const { stdout } = await execAsync(
      `/opt/homebrew/bin/gog calendar events primary --from "${fromISO}" --to "${toISO}" --account kyle.schildkraut@gmail.com --plain`,
      { env: { ...process.env, PATH: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" } }
    );

    // Normalize a date string: if date-only (YYYY-MM-DD), append T00:00:00
    const normalizeDate = (s: string): string => {
      if (!s) return new Date().toISOString();
      // Already has time component
      if (s.includes("T") || s.includes(" ")) return s;
      // Date-only all-day event — treat as noon local to avoid timezone flip
      return `${s}T12:00:00`;
    };

    const events: CalendarEvent[] = stdout
      .split("\n")
      .filter((line) => line.trim())
      // Skip header line (starts with "ID" or has non-date second column)
      .filter((line) => !line.startsWith("ID\t") && !line.startsWith("id\t"))
      .map((line) => {
        const parts = line.split("\t");
        return {
          id: parts[0]?.trim() ?? "",
          start: normalizeDate(parts[1]?.trim() ?? ""),
          end: normalizeDate(parts[2]?.trim() ?? ""),
          summary: parts[3]?.trim() ?? "(no title)",
        };
      })
      .filter((e) => e.id && e.id !== "ID");

    return NextResponse.json(events);
  } catch (err) {
    console.error("Calendar API error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

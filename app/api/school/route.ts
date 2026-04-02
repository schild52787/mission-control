import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface SchoolEmail {
  id: string;
  date: string;
  from: string;
  subject: string;
  labels: string;
  thread: string;
}

export async function GET() {
  try {
    const { stdout } = await execAsync(
      `/opt/homebrew/bin/gog gmail search "in:inbox from:minnetonkaschools.org" --max 8 --account kyle.schildkraut@gmail.com --plain`,
      {
        env: {
          ...process.env,
          PATH: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin",
        },
      }
    );

    const seen = new Set<string>();
    const messages: SchoolEmail[] = stdout
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#") && !line.startsWith("ID\t"))
      .map((line) => {
        const parts = line.split("\t");
        return {
          id: parts[0]?.trim() ?? "",
          date: parts[1]?.trim() ?? "",
          from: parts[2]?.trim() ?? "",
          subject: parts[3]?.trim() ?? "(no subject)",
          labels: parts[4]?.trim() ?? "",
          thread: parts[5]?.trim() ?? "",
        };
      })
      .filter((m) => {
        if (!m.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .slice(0, 6);

    return NextResponse.json(messages);
  } catch (err) {
    console.error("School API error:", err);
    return NextResponse.json([]);
  }
}

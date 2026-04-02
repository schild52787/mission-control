import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface EmailMessage {
  id: string;
  date: string;
  from: string;
  subject: string;
  labels: string;
  thread: string;
  priority: "urgent" | "important" | "action";
}

const GOG = "/opt/homebrew/bin/gog";
const ACCT = "kyle.schildkraut@gmail.com";
const ENV = { ...process.env, PATH: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" };

function parseLines(stdout: string, priority: EmailMessage["priority"]): EmailMessage[] {
  return stdout
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("ID\t"))
    .map((line) => {
      const parts = line.split("\t");
      return {
        id: parts[0]?.trim() ?? "",
        date: parts[1]?.trim() ?? "",
        from: parts[2]?.trim() ?? "",
        subject: parts[3]?.trim() ?? "(no subject)",
        labels: parts[4]?.trim() ?? "",
        thread: parts[5]?.trim() ?? "",
        priority,
      };
    })
    .filter((m) => m.id && m.id !== "ID");
}

async function search(query: string, max = 5, priority: EmailMessage["priority"]): Promise<EmailMessage[]> {
  try {
    const { stdout } = await execAsync(
      `${GOG} gmail search "${query}" --max ${max} --account ${ACCT} --plain`,
      { env: ENV, timeout: 10_000 }
    );
    return parseLines(stdout, priority);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // Run 3 targeted queries in parallel
    const [starred, important, actionKeywords] = await Promise.all([
      // Starred = Kyle manually flagged
      search(
        'in:inbox is:unread is:starred -category:promotions',
        5,
        'urgent'
      ),
      // Important by Gmail's algorithm, from real people (not automated)
      search(
        'in:inbox is:unread is:important -category:promotions -category:updates -category:social -category:forums from:(*@gmail.com OR *@yahoo.com OR *@hotmail.com OR *@cargill.com OR *@jpmorgan.com OR *@outlook.com)',
        8,
        'important'
      ),
      // Action keywords in subject
      search(
        'in:inbox is:unread subject:(action OR urgent OR deadline OR "please respond" OR "follow up" OR "response needed" OR "time sensitive" OR "by today" OR "by tomorrow") -category:promotions',
        5,
        'action'
      ),
    ]);

    // Deduplicate by id, preserve priority order
    const seen = new Set<string>();
    const all: EmailMessage[] = [];
    for (const msg of [...starred, ...actionKeywords, ...important]) {
      if (msg.id && !seen.has(msg.id)) {
        seen.add(msg.id);
        all.push(msg);
      }
    }

    return NextResponse.json(all.slice(0, 12));
  } catch (err) {
    console.error("Inbox API error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

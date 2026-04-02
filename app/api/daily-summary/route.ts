import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);
const ENV = { ...process.env, PATH: "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin", HOME: "/Users/kyleschildkraut" };
const CACHE_FILE = path.join(os.tmpdir(), "mc-daily-summary-v2.json");
const CACHE_TTL_MS = 5 * 60 * 60 * 1000; // 5 hours

const BRAVE_KEY = process.env.BRAVE_API_KEY ?? "";
const GOG = "/opt/homebrew/bin/gog";
const ACCT = "kyle.schildkraut@gmail.com";

export interface SummarySection {
  icon: string;
  title: string;
  bullets: string[];
}

export interface DailySummaryData {
  sections: SummarySection[];
  generatedAt: string;
  fromCache: boolean;
}

// ─── Brave Search ──────────────────────────────────────────────────────────────

async function braveSearch(query: string, count = 6): Promise<string> {
  if (!BRAVE_KEY) return "";
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}&freshness=pd`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "X-Subscription-Token": BRAVE_KEY },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const data = await res.json() as { web?: { results?: Array<{ title?: string; description?: string; url?: string }> } };
    return (data.web?.results ?? [])
      .map((r) => `TITLE: ${r.title}\nSNIPPET: ${r.description}\nURL: ${r.url}`)
      .join("\n---\n");
  } catch { return ""; }
}

// ─── Gmail newsletter body fetch ───────────────────────────────────────────────

async function fetchNewsletterBodies(): Promise<string> {
  try {
    // Get IDs of recent newsletter emails
    const { stdout: listOut } = await execAsync(
      `${GOG} gmail search "in:inbox newer_than:1d (category:updates OR label:newsletters OR subject:(newsletter OR digest OR weekly OR daily OR roundup OR recap OR briefing OR morning)) -is:starred" --max 10 --account ${ACCT} --plain`,
      { env: ENV, timeout: 12_000 }
    );

    const ids = listOut
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("ID\t"))
      .map((l) => l.split("\t")[0]?.trim())
      .filter((id): id is string => Boolean(id) && id !== "ID")
      .slice(0, 5);

    if (ids.length === 0) return "";

    // Fetch subject + snippet for each
    const bodies: string[] = [];
    for (const id of ids) {
      try {
        const { stdout: body } = await execAsync(
          `${GOG} gmail show ${id} --account ${ACCT} --plain 2>/dev/null | head -60`,
          { env: ENV, timeout: 8_000 }
        );
        if (body.trim()) bodies.push(body.trim().slice(0, 800));
      } catch { /* skip */ }
    }

    return bodies.join("\n\n---NEWSLETTER---\n\n");
  } catch { return ""; }
}

// ─── Claude call ───────────────────────────────────────────────────────────────

async function callClaude(prompt: string): Promise<string> {
  try {
    const tmpFile = path.join(os.tmpdir(), `mc-prompt-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, prompt);
    const { stdout } = await execAsync(
      `/Users/kyleschildkraut/.npm-global/bin/claude -p --output-format text < "${tmpFile}" 2>/dev/null`,
      { env: ENV, timeout: 90_000, maxBuffer: 2 * 1024 * 1024 }
    );
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    return stdout.trim();
  } catch { return ""; }
}

// ─── Parse sections ────────────────────────────────────────────────────────────

function parseSections(raw: string): SummarySection[] {
  const sections: SummarySection[] = [];
  let current: SummarySection | null = null;

  for (const line of raw.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const headerMatch = line.match(/^#{1,3}\s*(.+)$/);
    if (headerMatch) {
      if (current?.bullets.length) sections.push(current);
      const text = headerMatch[1];
      const icon = text.match(/^(\p{Emoji})/u)?.[1] ?? "•";
      const title = text.replace(/^\p{Emoji}+\s*/u, "").trim();
      current = { icon, title, bullets: [] };
    } else if ((line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* ")) && current) {
      const b = line.replace(/^[-•*]\s+/, "").trim();
      if (b) current.bullets.push(b);
    } else if (current && line.length > 15 && !line.startsWith("#") && !line.startsWith("---")) {
      current.bullets.push(line);
    }
  }

  if (current?.bullets.length) sections.push(current);
  return sections;
}

// ─── Main handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "1";

  if (!force) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as DailySummaryData & { _ts: number };
      if (Date.now() - cached._ts < CACHE_TTL_MS) {
        return NextResponse.json({ ...cached, fromCache: true });
      }
    } catch { /* cache miss */ }
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Parallel data gathering — broad and deep
  const [
    arsenalMatch,
    arsenalTransfers,
    arsenalStandings,
    packersNews,
    aiNews,
    aiReddit,
    deltaDeals,
    pointsNews,
    bucksNews,
    newsletters,
  ] = await Promise.all([
    braveSearch("Arsenal FC match result latest news today 2026"),
    braveSearch("Arsenal FC transfer news injury update lineup 2026 site:reddit.com OR site:bbc.com OR site:theguardian.com"),
    braveSearch("Premier League table standings Arsenal top 2026"),
    braveSearch("Green Bay Packers news NFL 2026 free agency draft"),
    braveSearch("AI artificial intelligence LLM news today Claude OpenAI Gemini 2026"),
    braveSearch("site:reddit.com/r/MachineLearning OR site:reddit.com/r/artificial AI LLM news 2026"),
    braveSearch("Delta Air Lines SkyMiles award deals sale MSP Minneapolis 2026"),
    braveSearch("travel points miles credit card deals 2026 amex chase"),
    braveSearch("Milwaukee Bucks NBA news today 2026"),
    fetchNewsletterBodies(),
  ]);

  const prompt = `Today is ${today}. You are writing a daily personal briefing for Kyle — Arsenal FC obsessive, Green Bay Packers and Milwaukee Bucks fan, travel/points optimizer, and AI enthusiast. This is a PERSONAL briefing only — no work, no tax, no professional topics.

CRITICAL FORMATTING RULES:
- Use EXACTLY these section headers with their emoji (e.g. "## 🔴 Arsenal")
- Under each header write 3–5 bullet points starting with "- "
- Each bullet: 1–2 sentences max, specific facts only — no filler
- Include actual scores, names, dates, amounts where available
- Skip any section where you have genuinely nothing useful to say
- Do NOT include preamble, do NOT address Kyle directly

## 🔴 Arsenal
Match results, standings, key injuries, transfer rumors. Lead with the most recent match if there is one.
SOURCE DATA:
${arsenalMatch}
${arsenalTransfers}
${arsenalStandings}

## 🏈 Packers
Roster moves, free agency, draft news, coaching staff. Focus on what actually happened.
SOURCE DATA:
${packersNews}

## 🏀 Bucks
Game results, roster news, standings. Only if meaningful — skip if nothing happened.
SOURCE DATA:
${bucksNews}

## 🤖 AI & Tech
Most important AI/LLM developments — personal interest angle only (new tools, model releases, interesting demos). Not professional/work applications.
SOURCE DATA:
${aiNews}
${aiReddit}

## ✈️ Travel & Points
Delta deals, award availability, credit card news, points strategy. Specific routes and numbers if available.
SOURCE DATA:
${deltaDeals}
${pointsNews}

${newsletters ? `## 📬 From Your Newsletters\nSummarize the 3–4 most useful/interesting things from these newsletter bodies. Personal interest only — skip anything work/tax/finance-professional. Cite the source name.\n${newsletters.slice(0, 3000)}` : ""}

Write ONLY the formatted sections. Be specific. Be dense. Skip padding.`;

  const raw = await callClaude(prompt);
  let sections = raw ? parseSections(raw) : [];

  // Fallback from raw search data if Claude failed
  if (sections.length === 0) {
    const sources: Array<[string, string, string]> = [
      ["🔴", "Arsenal", arsenalMatch],
      ["🏈", "Packers", packersNews],
      ["🏀", "Bucks", bucksNews],
      ["🤖", "AI & Tech", aiNews],
      ["✈️", "Travel & Points", deltaDeals],
    ];
    for (const [icon, title, data] of sources) {
      if (!data) continue;
      const bullets = data.split("---").slice(0, 4)
        .map((block) => block.match(/TITLE: (.+)/)?.[1]?.trim())
        .filter((t): t is string => Boolean(t));
      if (bullets.length) sections.push({ icon, title, bullets });
    }
  }

  const result: DailySummaryData & { _ts: number } = {
    sections,
    generatedAt: new Date().toISOString(),
    fromCache: false,
    _ts: Date.now(),
  };

  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(result)); } catch { /* ignore */ }
  return NextResponse.json(result);
}

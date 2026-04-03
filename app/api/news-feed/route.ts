import { NextResponse } from "next/server";
import fs from "fs";

const BRIEFING_FILE = "/Users/kyleschildkraut/projects/daily-briefing/data/briefing.json";
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

interface BriefingItem {
  headline: string;
  summary: string;
  source: string;
  rating: number;
  url: string;
  publishedAgo: string;
}

interface BriefingSection {
  id: string;
  emoji: string;
  title: string;
  items: BriefingItem[];
  empty: boolean;
}

interface Briefing {
  generatedAt: string;
  date: string;
  sections: BriefingSection[];
}

export interface NewsFeedItem {
  headline: string;
  summary: string;
  source: string;
  sourceDomain: string;
  rating: number;
  url: string;
  publishedAgo: string;
  sectionEmoji: string;
  sectionId: string;
}

export interface NewsFeedResponse {
  items: NewsFeedItem[];
  generatedAt: string;
  stale: boolean;
  missing: boolean;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function GET() {
  try {
    const raw = fs.readFileSync(BRIEFING_FILE, "utf-8");
    const briefing = JSON.parse(raw) as Briefing;

    const ageMs = Date.now() - new Date(briefing.generatedAt).getTime();
    const stale = ageMs > STALE_THRESHOLD_MS;

    const allItems: NewsFeedItem[] = briefing.sections
      .filter((s) => !s.empty && s.items?.length > 0)
      .flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          sourceDomain: extractDomain(item.url),
          sectionEmoji: section.emoji,
          sectionId: section.id,
        }))
      );

    const items = allItems
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 15);

    return NextResponse.json({
      items,
      generatedAt: briefing.generatedAt,
      stale,
      missing: false,
    } satisfies NewsFeedResponse);
  } catch {
    return NextResponse.json({
      items: [],
      generatedAt: new Date().toISOString(),
      stale: true,
      missing: true,
    } satisfies NewsFeedResponse);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const MEMORY_DIR = "/Users/kyleschildkraut/.openclaw/workspace/memory";
const MEMORY_MAIN = "/Users/kyleschildkraut/.openclaw/workspace/MEMORY.md";

interface MemoryEntry {
  filename: string;
  date: string | null;
  preview: string;
  content: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, " ")
    .trim();
}

function parseDateFromFilename(filename: string): string | null {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function readEntries(): MemoryEntry[] {
  const entries: MemoryEntry[] = [];

  // Read MEMORY.md first (pinned)
  try {
    const content = readFileSync(MEMORY_MAIN, "utf-8");
    entries.push({
      filename: "MEMORY.md",
      date: null,
      preview: stripMarkdown(content).slice(0, 200),
      content,
    });
  } catch {
    // File doesn't exist — skip
  }

  // Read daily files
  try {
    const files = readdirSync(MEMORY_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse();

    for (const filename of files) {
      try {
        const content = readFileSync(join(MEMORY_DIR, filename), "utf-8");
        entries.push({
          filename,
          date: parseDateFromFilename(filename),
          preview: stripMarkdown(content).slice(0, 200),
          content,
        });
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    // Directory doesn't exist — skip
  }

  return entries;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get("file");

  if (file) {
    // Return single file content
    try {
      const filePath =
        file === "MEMORY.md"
          ? MEMORY_MAIN
          : join(MEMORY_DIR, file);
      const content = readFileSync(filePath, "utf-8");
      return NextResponse.json({ content });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const entries = readEntries();
  return NextResponse.json(entries);
}

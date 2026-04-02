import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DOCS_FILE = join(process.cwd(), "data", "docs.json");

type Category = "travel" | "work" | "fitness" | "planning" | "general";

interface Doc {
  id: string;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  format: string;
  createdAt: string;
}

function readDocs(): Doc[] {
  try {
    return JSON.parse(readFileSync(DOCS_FILE, "utf-8")) as Doc[];
  } catch {
    return [];
  }
}

function writeDocs(docs: Doc[]): void {
  writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2));
}

function genId(docs: Doc[]): string {
  const nums = docs
    .map((d) => parseInt(d.id.replace("doc-", ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `doc-${String(max + 1).padStart(3, "0")}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase();
  const category = searchParams.get("category");

  let docs = readDocs();

  if (search) {
    docs = docs.filter(
      (d) =>
        d.title.toLowerCase().includes(search) ||
        d.content.toLowerCase().includes(search) ||
        d.tags.some((t) => t.toLowerCase().includes(search))
    );
  }

  if (category && category !== "all") {
    docs = docs.filter((d) => d.category === category);
  }

  // Sort by createdAt desc
  docs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    title: string;
    content: string;
    category: Category;
    tags: string[];
    format: string;
  };
  const docs = readDocs();
  const newDoc: Doc = {
    id: genId(docs),
    title: body.title,
    content: body.content ?? "",
    category: body.category ?? "general",
    tags: body.tags ?? [],
    format: body.format ?? "text",
    createdAt: new Date().toISOString(),
  };
  docs.push(newDoc);
  writeDocs(docs);
  return NextResponse.json(newDoc, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const docs = readDocs();
  const filtered = docs.filter((d) => d.id !== id);
  writeDocs(filtered);
  return NextResponse.json({ ok: true });
}

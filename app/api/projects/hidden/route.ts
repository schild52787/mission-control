import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const HIDDEN_FILE = path.join(process.cwd(), "data", "hidden-projects.json");

function readHidden(): string[] {
  try {
    return JSON.parse(fs.readFileSync(HIDDEN_FILE, "utf-8")) as string[];
  } catch {
    return [];
  }
}

function writeHidden(ids: string[]): void {
  fs.writeFileSync(HIDDEN_FILE, JSON.stringify(ids, null, 2));
}

export async function GET() {
  return NextResponse.json(readHidden());
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { id: string; hidden: boolean };

  if (!body.id || typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const hidden = readHidden();

  if (body.hidden && !hidden.includes(body.id)) {
    hidden.push(body.id);
  } else if (!body.hidden) {
    const idx = hidden.indexOf(body.id);
    if (idx !== -1) hidden.splice(idx, 1);
  }

  writeHidden(hidden);
  return NextResponse.json({ ok: true, hidden });
}

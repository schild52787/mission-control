import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface Action {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
  url?: string;
  urlLabel?: string;
  deadline?: string;
  completed: boolean;
  completedAt: string | null;
}

const ACTIONS_FILE = path.join(process.cwd(), "data", "actions.json");

function readActions(): Action[] {
  try {
    return JSON.parse(fs.readFileSync(ACTIONS_FILE, "utf-8")) as Action[];
  } catch {
    return [];
  }
}

function writeActions(actions: Action[]): void {
  fs.writeFileSync(ACTIONS_FILE, JSON.stringify(actions, null, 2));
}

export async function GET() {
  return NextResponse.json(readActions());
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { id: string; completed: boolean };

  if (!body.id || typeof body.completed !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const actions = readActions();
  const idx = actions.findIndex((a) => a.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  actions[idx].completed = body.completed;
  actions[idx].completedAt = body.completed ? new Date().toISOString() : null;
  writeActions(actions);

  return NextResponse.json({ ok: true, action: actions[idx] });
}

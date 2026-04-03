import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "proposals.json");
const ACCEPTED_FILE = path.join(process.cwd(), "data", "accepted-projects.json");

export interface Proposal {
  id: string;
  category: "work" | "personal";
  emoji: string;
  title: string;
  description: string;
  stack: string[];
  effort: "low" | "medium" | "high";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  decidedAt?: string;
}

function readProposals(): Proposal[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Proposal[];
  } catch {
    return [];
  }
}

function writeProposals(proposals: Proposal[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(proposals, null, 2));
}

function appendAccepted(proposal: Proposal): void {
  let accepted: Proposal[] = [];
  try {
    accepted = JSON.parse(fs.readFileSync(ACCEPTED_FILE, "utf-8")) as Proposal[];
  } catch { /* start fresh */ }
  accepted.push(proposal);
  fs.writeFileSync(ACCEPTED_FILE, JSON.stringify(accepted, null, 2));
}

export async function GET() {
  const proposals = readProposals();
  const now = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  const cleaned = proposals.filter((p) => {
    if (p.status !== "rejected" || !p.decidedAt) return true;
    const decidedTime = new Date(p.decidedAt).getTime();
    return now - decidedTime < THREE_DAYS_MS;
  });

  // Persist if any were removed
  if (cleaned.length !== proposals.length) {
    writeProposals(cleaned);
  }

  return NextResponse.json(cleaned.filter((p: Record<string, unknown>) => !p.deleted));
}

export async function POST(request: Request) {
  const { id, action } = (await request.json()) as { id: string; action: "accept" | "reject" };

  const proposals = readProposals();
  const idx = proposals.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  proposals[idx].status = action === "accept" ? "accepted" : "rejected";
  proposals[idx].decidedAt = new Date().toISOString().slice(0, 10);
  writeProposals(proposals);

  if (action === "accept") {
    appendAccepted(proposals[idx]);
  }

  return NextResponse.json({ ok: true, proposal: proposals[idx] });
}

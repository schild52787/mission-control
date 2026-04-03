import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "proposals.json");
const ACCEPTED_FILE = path.join(process.cwd(), "data", "accepted-projects.json");

interface Proposal {
  id: string;
  category: string;
  emoji: string;
  title: string;
  description: string;
  stack: string[];
  effort: "low" | "medium" | "high";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  decidedAt?: string;
  port?: number;
  deleted?: boolean;
  deletedAt?: string;
}

type PatchBody =
  | { id: string; status: "pending" | "accepted" | "rejected" }
  | { id: string; deleted: true };

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

export async function PATCH(request: Request) {
  const body = (await request.json()) as PatchBody;
  const { id } = body;

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const proposals = readProposals();
  const idx = proposals.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Handle delete
  if ("deleted" in body && body.deleted === true) {
    proposals[idx].deleted = true;
    proposals[idx].deletedAt = new Date().toISOString();
    writeProposals(proposals);

    // Remove from accepted-projects.json if present
    try {
      const accepted = JSON.parse(fs.readFileSync(ACCEPTED_FILE, "utf-8")) as Proposal[];
      const filtered = accepted.filter((p) => p.id !== id);
      if (filtered.length !== accepted.length) {
        fs.writeFileSync(ACCEPTED_FILE, JSON.stringify(filtered, null, 2));
      }
    } catch { /* file may not exist */ }

    return NextResponse.json({ ok: true });
  }

  // Handle status change (existing logic)
  const { status } = body as { id: string; status: "pending" | "accepted" | "rejected" };

  if (!["pending", "accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const oldStatus = proposals[idx].status;
  proposals[idx].status = status;

  if (status !== "pending") {
    proposals[idx].decidedAt = new Date().toISOString().slice(0, 10);
  } else {
    delete proposals[idx].decidedAt;
  }

  writeProposals(proposals);

  // If newly accepted, also append to accepted-projects.json
  if (status === "accepted" && oldStatus !== "accepted") {
    appendAccepted(proposals[idx]);
  }

  return NextResponse.json({ ok: true, proposal: proposals[idx] });
}

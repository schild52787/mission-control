import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const ACTIVITY_FILE = join(process.cwd(), "data", "task-activity.json");

export async function GET() {
  try {
    const data = JSON.parse(readFileSync(ACTIVITY_FILE, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

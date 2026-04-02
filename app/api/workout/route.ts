import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { homedir } from "os";
import path from "path";

const DATA_PATH = path.join(
  homedir(),
  ".openclaw/workspace/data/workouts.json"
);

export interface WorkoutEntry {
  date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
}

export interface WorkoutData {
  log: WorkoutEntry[];
}

const DEFAULT_DATA: WorkoutData = { log: [] };

export async function GET() {
  try {
    let data: WorkoutData;
    try {
      const raw = await readFile(DATA_PATH, "utf-8");
      data = JSON.parse(raw) as WorkoutData;
    } catch {
      await mkdir(path.dirname(DATA_PATH), { recursive: true });
      await writeFile(DATA_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
      data = DEFAULT_DATA;
    }

    const sorted = [...(data.log ?? [])]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    return NextResponse.json({ log: sorted });
  } catch (err) {
    console.error("Workout API error:", err);
    return NextResponse.json({ log: [] });
  }
}

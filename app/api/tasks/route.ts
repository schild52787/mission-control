import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const TASKS_FILE = join(process.cwd(), "data", "tasks.json");
const ACTIVITY_FILE = join(process.cwd(), "data", "task-activity.json");

type Priority = "high" | "medium" | "low";
type Status = "backlog" | "in_progress" | "review" | "done";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: Status;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

interface ActivityEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  fromStatus: Status;
  toStatus: Status;
  timestamp: string;
}

function readTasks(): Task[] {
  try {
    return JSON.parse(readFileSync(TASKS_FILE, "utf-8")) as Task[];
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]): void {
  writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

function readActivity(): ActivityEntry[] {
  try {
    return JSON.parse(readFileSync(ACTIVITY_FILE, "utf-8")) as ActivityEntry[];
  } catch {
    return [];
  }
}

function appendActivity(entry: ActivityEntry): void {
  const activity = readActivity();
  activity.push(entry);
  writeFileSync(ACTIVITY_FILE, JSON.stringify(activity, null, 2));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function genId(tasks: Task[]): string {
  const nums = tasks
    .map((t) => parseInt(t.id.replace("task-", ""), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `task-${String(max + 1).padStart(3, "0")}`;
}

export async function GET() {
  const tasks = readTasks();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    title: string;
    description: string;
    assignee: string;
    priority: Priority;
  };
  const tasks = readTasks();
  const newTask: Task = {
    id: genId(tasks),
    title: body.title,
    description: body.description ?? "",
    assignee: body.assignee ?? "kyle",
    status: "backlog",
    priority: body.priority ?? "medium",
    createdAt: today(),
    updatedAt: today(),
  };
  tasks.push(newTask);
  writeTasks(tasks);
  return NextResponse.json(newTask, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Partial<Task> & { id: string };
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === body.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const old = tasks[idx];
  const updated: Task = { ...old, ...body, updatedAt: today() };
  tasks[idx] = updated;
  writeTasks(tasks);

  // Append activity when status changes
  if (body.status && body.status !== old.status) {
    const activityId = `act-${Date.now()}`;
    appendActivity({
      id: activityId,
      taskId: old.id,
      taskTitle: updated.title,
      fromStatus: old.status,
      toStatus: body.status,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json(updated);
}

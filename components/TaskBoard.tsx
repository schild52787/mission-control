"use client";

import { useState, useEffect, useCallback } from "react";

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

const COLUMNS: { key: Status; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

const PRIORITY_DOT: Record<Priority, string> = {
  high: "bg-[#dc2626]",
  medium: "bg-[#d97706]",
  low: "bg-[#9ca3af]",
};

const STATUS_LABELS: Record<Status, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

function AssigneeBadge({ assignee }: { assignee: string }) {
  const isKyle = assignee.toLowerCase() === "kyle";
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold shrink-0 ${
      isKyle ? "bg-blue-50 text-[#2563eb] border border-blue-200" : "bg-purple-50 text-purple-600 border border-purple-200"
    }`}>
      {assignee[0].toUpperCase()}
    </span>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const truncated = task.description.length > 80 ? task.description.slice(0, 80) + "\u2026" : task.description;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border border-[#e5e7eb] bg-white hover:border-[#2563eb] hover:shadow-sm transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-sm font-semibold text-[#111827] leading-snug">{task.title}</span>
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${PRIORITY_DOT[task.priority]}`} />
      </div>
      {truncated && <p className="text-xs text-[#6b7280] leading-snug mb-2">{truncated}</p>}
      <div className="flex items-center justify-between">
        <AssigneeBadge assignee={task.assignee} />
        <span className="text-[10px] text-[#9ca3af] font-mono">{task.updatedAt}</span>
      </div>
    </button>
  );
}

function TaskModal({ task, onClose, onStatusChange }: { task: Task; onClose: () => void; onStatusChange: (taskId: string, status: Status) => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 max-w-lg w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${PRIORITY_DOT[task.priority]}`} />
            <h2 className="text-base font-bold text-[#111827]">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#111827] text-lg leading-none shrink-0">&times;</button>
        </div>

        <p className="text-sm text-[#6b7280] leading-relaxed mb-4">{task.description}</p>

        <div className="flex items-center gap-3 mb-4 text-xs text-[#9ca3af]">
          <AssigneeBadge assignee={task.assignee} />
          <span className="text-[#6b7280]">{task.assignee}</span>
          <span>&middot;</span>
          <span>{task.priority} priority</span>
          <span>&middot;</span>
          <span>updated {task.updatedAt}</span>
        </div>

        <div className="border-t border-[#e5e7eb] pt-4">
          <p className="text-[11px] text-[#9ca3af] font-semibold tracking-widest uppercase mb-2">Move to</p>
          <div className="flex flex-wrap gap-2">
            {COLUMNS.map((col) => (
              <button
                key={col.key}
                onClick={() => { onStatusChange(task.id, col.key); onClose(); }}
                disabled={task.status === col.key}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  task.status === col.key
                    ? "bg-blue-50 border-[#2563eb] text-[#2563eb] cursor-default"
                    : "border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb] hover:text-[#2563eb]"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("kyle");
  const [priority, setPriority] = useState<Priority>("medium");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, assignee, priority }),
      });
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white border border-[#e5e7eb] rounded-lg p-6 max-w-md w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#111827]">New Task</h2>
          <button type="button" onClick={onClose} className="text-[#9ca3af] hover:text-[#111827] text-lg">&times;</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase mb-1">Title</label>
            <input className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase mb-1">Description</label>
            <textarea className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] resize-none" placeholder="Optional details" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase mb-1">Assignee</label>
              <select className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#2563eb]" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="kyle">Kyle</option>
                <option value="claw">Claw</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase mb-1">Priority</label>
              <select className="w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#2563eb]" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6b7280] hover:text-[#111827] border border-[#e5e7eb] hover:border-[#9ca3af] rounded-lg transition-colors">Cancel</button>
          <button type="submit" disabled={saving || !title.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 rounded-lg transition-colors">
            {saving ? "Saving\u2026" : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);

  const loadData = useCallback(async () => {
    const [tasksRes, activityRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/tasks/activity").catch(() => null),
    ]);
    const tasksData: Task[] = await tasksRes.json();
    setTasks(tasksData);
    if (activityRes?.ok) {
      const actData: ActivityEntry[] = await activityRes.json();
      setActivity(actData);
    }
    setLoading(false);
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks/activity");
      if (res.ok) {
        const data: ActivityEntry[] = await res.json();
        setActivity(data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleStatusChange(taskId: string, status: Status) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status }),
    });
    const newEntry: ActivityEntry = {
      id: `act-${Date.now()}`,
      taskId,
      taskTitle: task.title,
      fromStatus: task.status,
      toStatus: status,
      timestamp: new Date().toISOString(),
    };
    setActivity((prev) => [...prev, newEntry]);
    await loadActivity();
  }

  const tasksByStatus = (status: Status) => tasks.filter((t) => t.status === status);

  const recentActivity = [...activity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#9ca3af]">Loading tasks&hellip;</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#6b7280]">Task Board</h1>
        <button onClick={() => setShowNewTask(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors">
          + New Task
        </button>
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.key);
            return (
              <div key={col.key} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase">{col.label}</span>
                  <span className="text-[10px] font-mono text-[#9ca3af] bg-[#f9fafb] px-1.5 py-0.5 rounded-full border border-[#e5e7eb]">{colTasks.length}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-[80px]">
                  {colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-16 border border-dashed border-[#e5e7eb] rounded-lg flex items-center justify-center text-[10px] text-[#9ca3af]">empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden lg:flex flex-col w-56 shrink-0">
          <div className="px-1 mb-2">
            <span className="text-[11px] font-semibold tracking-widest text-[#6b7280] uppercase">Activity</span>
          </div>
          <div className="flex flex-col gap-2">
            {recentActivity.length === 0 && <p className="text-[11px] text-[#9ca3af] px-1">No activity yet</p>}
            {recentActivity.map((entry) => (
              <div key={entry.id} className="p-2.5 rounded-lg bg-[#f9fafb] border border-[#e5e7eb]">
                <p className="text-[11px] text-[#111827] leading-snug font-medium mb-1">{entry.taskTitle}</p>
                <p className="text-[10px] text-[#9ca3af]">
                  <span className="text-[#9ca3af]">{STATUS_LABELS[entry.fromStatus]}</span>{" "}&rarr;{" "}
                  <span className="text-[#2563eb]">{STATUS_LABELS[entry.toStatus]}</span>
                </p>
                <p className="text-[9px] text-[#9ca3af] font-mono mt-1">{formatTimestamp(entry.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={(id, status) => {
            handleStatusChange(id, status);
            setSelectedTask((prev) => prev ? { ...prev, status } : null);
          }}
        />
      )}
      {showNewTask && <NewTaskModal onClose={() => setShowNewTask(false)} onCreated={loadData} />}
    </>
  );
}

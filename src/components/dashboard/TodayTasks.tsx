"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const ACCENT = "#2f6bf2";

const initialTasks = [
  { id: 1, label: "Review Office101 Leads",    time: "08:00  10:00 AM", done: false },
  { id: 2, label: "Team Standup Meeting",       time: "11:00  12:00 PM", done: false },
  { id: 3, label: "Send IntelTrademark Invoice",time: "01:00  02:00 PM", done: true  },
  { id: 4, label: "Office102 Client Call",      time: "03:00  04:00 PM", done: false },
];

export function TodayTasks() {
  const [tasks, setTasks] = useState(initialTasks);

  const toggle = (id: number) =>
    setTasks(t => t.map(task => task.id === id ? { ...task, done: !task.done } : task));

  const remaining = tasks.filter(t => !t.done).length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>Today Task</h2>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
          >
            {remaining}
          </span>
        </div>
        <button
          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: `${ACCENT}18`, color: ACCENT }}
        >
          <Plus size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 group">
            <button
              onClick={() => toggle(task.id)}
              className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                borderColor: task.done ? ACCENT : "#d1d5db",
                backgroundColor: task.done ? ACCENT : "transparent",
              }}
            >
              {task.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span
              className="flex-1 text-sm transition-all"
              style={{
                color: task.done ? "#9ca3af" : "#374151",
                textDecoration: task.done ? "line-through" : "none",
              }}
            >
              {task.label}
            </span>
            <span className="text-xs font-medium" style={{ color: ACCENT }}>
              {task.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

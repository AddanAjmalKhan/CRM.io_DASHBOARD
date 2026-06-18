"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

const ACCENT = "#2f6bf2";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarWidget() {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const daysInMonth  = getDaysInMonth(current.year, current.month);
  const firstDay     = getFirstDayOfMonth(current.year, current.month);
  const isCurrentMonth = current.year === today.getFullYear() && current.month === today.getMonth();

  const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  // Build grid cells
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
            {MONTHS[current.month]}, {current.year}
          </h2>
          <ChevronRight size={16} style={{ color: "#9ca3af" }} />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={16} style={{ color: "#6b7280" }} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <MoreHorizontal size={16} style={{ color: "#6b7280" }} />
          </button>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={16} style={{ color: "#6b7280" }} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: "#9ca3af" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          const isToday = isCurrentMonth && day === today.getDate();
          const hasDot  = day && [3, 7, 14, 21, 25].includes(day);
          return (
            <div key={idx} className="flex flex-col items-center py-1">
              {day ? (
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isToday ? ACCENT : "transparent",
                    color: isToday ? "#fff" : "#374151",
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {day}
                </button>
              ) : (
                <span className="w-8 h-8" />
              )}
              {hasDot && !isToday && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: ACCENT }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

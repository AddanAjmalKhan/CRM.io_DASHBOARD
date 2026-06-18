"use client";

import { useState } from "react";
import { Send, Smile, Paperclip } from "lucide-react";

const ACCENT = "#2f6bf2";

const members = [
  { initials: "SM", color: "#3b82f6" },
  { initials: "KL", color: "#10b981" },
  { initials: "MR", color: "#8b5cf6" },
];

const messages = [
  { id: 1, from: "KL",  color: "#10b981", name: "Kate",  text: "Hey @members, how's the Office101 project going?", time: "3 minutes ago",  mine: false },
  { id: 2, from: "me",  color: ACCENT,    name: "You",   text: "I'm preparing the lead reports now.",               time: "2 minutes ago",  mine: true  },
  { id: 3, from: "SM",  color: "#3b82f6", name: "Sarah", text: "@Alex, let me know if you need the client files!",  time: "just now",       mine: false },
];

export function TeamChat() {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold" style={{ color: "#111827" }}>Team Chat</h2>
          <div className="flex">
            {members.map((m, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
                style={{ backgroundColor: m.color, marginLeft: i === 0 ? 0 : -6 }}
              >
                {m.initials}
              </div>
            ))}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white"
              style={{ backgroundColor: "#e5e7eb", color: "#6b7280", marginLeft: -6 }}
            >
              +7
            </div>
          </div>
        </div>
        <button
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
        >
          + Invite People
        </button>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-4 px-5 py-4 flex-1 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.mine ? "flex-row-reverse" : ""}`}>
            {!msg.mine && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: msg.color }}
              >
                {msg.from}
              </div>
            )}
            <div className={`flex flex-col gap-1 max-w-[75%] ${msg.mine ? "items-end" : ""}`}>
              <div
                className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={{
                  backgroundColor: msg.mine ? ACCENT : "#f3f4f6",
                  color: msg.mine ? "#fff" : "#374151",
                  borderBottomRightRadius: msg.mine ? 4 : undefined,
                  borderBottomLeftRadius: !msg.mine ? 4 : undefined,
                }}
              >
                {msg.text}
              </div>
              <span className="text-[10px]" style={{ color: "#9ca3af" }}>{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-gray-100">
        <button className="text-gray-400 hover:text-gray-500 transition-colors flex-shrink-0">
          <Paperclip size={16} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: "#374151" }}
        />
        <button className="text-gray-400 hover:text-gray-500 transition-colors flex-shrink-0">
          <Smile size={16} />
        </button>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ backgroundColor: ACCENT }}
        >
          <Send size={13} color="white" />
        </button>
      </div>
    </div>
  );
}

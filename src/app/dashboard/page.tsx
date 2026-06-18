"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, FileText, Mail, UserCheck, TrendingUp, ChevronDown, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const PRIMARY_BLUE = "#2f6bf2";

// 3 STATS mapping
const STATS = [
  {
    label: "Document",
    value: "12 Leads",
    sub: "17% Since last week",
    icon: FileText,
    href: "/dashboard/leads",
  },
  {
    label: "Contact",
    value: "5 Agents",
    sub: "17% Since last week",
    icon: UserCheck,
    href: "/dashboard/agents",
  },
  {
    label: "Email",
    value: "3 Inboxes",
    sub: "17% Since last week",
    icon: Mail,
    href: "/dashboard/emails",
  },
];

// Area Chart ("Recent Workflow")
const WORKFLOW_DATA = [4, 6, 5, 8, 7, 10, 9, 12, 11, 10, 13, 12];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function AreaChart() {
  const W = 500, H = 110;
  const max = Math.max(...WORKFLOW_DATA);
  const pts = WORKFLOW_DATA.map((v, i) => ({
    x: (i / (WORKFLOW_DATA.length - 1)) * W,
    y: H - (v / max) * (H - 18) - 8,
  }));
  const line = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return acc + ` C ${cx} ${prev.y} ${cx} ${pt.y} ${pt.x} ${pt.y}`;
  }, "");
  const area = line + ` L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 110 }}>
      <defs>
        <linearGradient id="wf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PRIMARY_BLUE} stopOpacity="0.25" />
          <stop offset="100%" stopColor={PRIMARY_BLUE} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wf)" />
      <path d={line} fill="none" stroke={PRIMARY_BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="3" fill={PRIMARY_BLUE} />
      ))}
    </svg>
  );
}

// Bar Chart ("Recent Marketing")
const MARKETING_DATA = [5, 7, 6, 9, 8, 11, 10, 13, 12, 11, 14, 13];

function BarChart() {
  const W = 500, H = 110;
  const max = Math.max(...MARKETING_DATA);
  const barWidth = 14;
  const gap = 24;
  const pts = MARKETING_DATA.map((v, i) => ({
    x: i * (barWidth + gap) + 20,
    y: H - (v / max) * (H - 20) - 10,
    h: (v / max) * (H - 20),
  }));
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 110 }}>
      {pts.map((pt, i) => (
        <rect
          key={i}
          x={pt.x}
          y={pt.y}
          width={barWidth}
          height={pt.h}
          rx="3"
          fill={PRIMARY_BLUE}
        />
      ))}
    </svg>
  );
}

// Document / Leads list
const LEADS_TABLE = [
  { name: "Annual Report", file: "PDF", category: "Property", author: "Dennis Castillo", status: "Send" },
  { name: "Business Plan", file: "WORD", category: "Cryptocurrency", author: "Lettie Jimenez", status: "Send" },
  { name: "Marketing Tool", file: "PDF", category: "Content Creator", author: "Craig Perkins", status: "Pending" },
];

// Active Agents (mapped to Popular Products)
const ACTIVE_AGENTS = [
  { name: "Saad Sattar", role: "Admin", initials: "SS", color: "#3b82f6", leads: "5 active leads" },
  { name: "Fariz", role: "Agent", initials: "FZ", color: "#7c3aed", leads: "3 active leads" },
  { name: "Shahwaiz", role: "Agent", initials: "SW", color: "#059669", leads: "2 active leads" },
  { name: "Shoaib Ali", role: "Agent", initials: "SA", color: "#d97706", leads: "1 active lead" },
];

// Chat list
const CHAT_USERS = [
  { name: "Debra Young", message: "How's the product?", initials: "DY", color: "#ec4899" },
  { name: "Dorothy Collins", message: "Filing trademark details", initials: "DC", color: "#14b8a6" },
  { name: "Chris Jordan", message: "Sent the invoice details", initials: "CJ", color: "#3b82f6" },
  { name: "Denise Murphy", message: "Trademark was approved!", initials: "DM", color: "#8b5cf6" },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 320px" }}>
      {/* ── Left Column: Overview / Charts / Tables ── */}
      <div className="flex flex-col gap-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-6">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                href={s.href}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md hover:border-slate-200 cursor-pointer"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400">{s.label}</span>
                  <span className="text-2xl font-black text-slate-800">{s.value}</span>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-500">
                    <TrendingUp size={12} />
                    {s.sub}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Recent Workflow Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Workflow</h3>
                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                  <TrendingUp size={11} /> 17%
                </span>
              </div>
            </div>
            <div className="mt-2">
              <AreaChart />
            </div>
            <div className="flex justify-between px-1 mt-2">
              {MONTHS.filter((_, idx) => idx % 2 === 0).map((m) => (
                <span key={m} className="text-[10px] font-semibold text-slate-300">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Marketing Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Marketing</h3>
                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                  <TrendingUp size={11} /> 17%
                </span>
              </div>
            </div>
            <div className="mt-2">
              <BarChart />
            </div>
            <div className="flex justify-between px-1 mt-2">
              {MONTHS.filter((_, idx) => idx % 2 === 0).map((m) => (
                <span key={m} className="text-[10px] font-semibold text-slate-300">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Document Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Document</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Document tracking information
              </p>
            </div>
            <button className="flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              Weekly
              <ChevronDown size={12} />
            </button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">File</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Author</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
                {LEADS_TABLE.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-3.5 pr-4 text-slate-800 font-bold">{row.name}</td>
                    <td className="py-3.5 pr-4 text-slate-400 font-bold">{row.file}</td>
                    <td className="py-3.5 pr-4 text-slate-500">{row.category}</td>
                    <td className="py-3.5 pr-4 text-slate-700 font-bold">{row.author}</td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold ${
                          row.status === "Send"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Right Column: Popular Products / Active Agents & Chat ── */}
      <div className="flex flex-col gap-6">
        {/* Popular Product (Active Agents) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-5">Popular Product</h3>
          <div className="flex flex-col gap-4">
            {ACTIVE_AGENTS.map((agent) => (
              <div key={agent.name} className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{agent.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{agent.leads}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-5">Chat</h3>
          <div className="flex flex-col gap-4">
            {CHAT_USERS.map((user) => (
              <div key={user.name} className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                  style={{ backgroundColor: user.color }}
                >
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {user.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

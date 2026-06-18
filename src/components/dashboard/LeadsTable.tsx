"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, MessageSquare, Pencil, Trash2, Check, Loader2 } from "lucide-react";
import { AddLeadModal, type LeadForm } from "./AddLeadModal";
import { LeadDetailsModal } from "./LeadDetailsModal";
import { AddCommentModal, type Comment } from "./AddCommentModal";

const NAVY = "#161642";

export type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  role: string;
  country?: string;
  ip_address?: string;
  ip_city?: string;
  ip_state?: string;
  ip_country?: string;
  created_at?: string;
  // computed for display
  initials: string;
  color: string;
};

const SOURCES  = ["All Sources", "IntelTrademark", "Office101", "Office102"];
const TYPES    = ["All Types", "Client", "Manager", "Volunteer"];
const PAGE_SIZE = 10;

const AVATAR_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1","#14b8a6"];

const getAvatarStyle = (name: string) => {
  const hash = name.split("").reduce((acc, c) => c.charCodeAt(0) + acc, 0);
  const palettes = [
    { bg: "bg-blue-50/80 text-blue-600 border border-blue-100/50" },
    { bg: "bg-emerald-50/80 text-emerald-600 border border-emerald-100/50" },
    { bg: "bg-amber-50/80 text-amber-600 border border-amber-100/50" },
    { bg: "bg-rose-50/80 text-rose-600 border border-rose-100/50" },
    { bg: "bg-purple-50/80 text-purple-600 border border-purple-100/50" },
    { bg: "bg-indigo-50/80 text-indigo-600 border border-indigo-100/50" },
    { bg: "bg-teal-50/80 text-teal-600 border border-teal-100/50" },
    { bg: "bg-sky-50/80 text-sky-600 border border-sky-100/50" },
  ];
  return palettes[hash % palettes.length];
};

function toDisplay(raw: any, index: number): Lead {
  const name = raw.name ?? "";
  const initials = name.trim().split(" ").filter(Boolean).map((w: string) => w[0].toUpperCase()).slice(0, 2).join("") || "?";
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return { ...raw, initials, color };
}

function toForm(l: Lead): LeadForm {
  return {
    name: l.name, email: l.email, phone: l.phone ?? "",
    source: l.source ?? "Office101", role: l.role ?? "Client",
    country: l.country ?? "",
    ip_address: l.ip_address ?? "", ip_city: l.ip_city ?? "",
    ip_state: l.ip_state ?? "", ip_country: l.ip_country ?? "",
  };
}

export function LeadsTable() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState("");
  const [source, setSource]     = useState("All Sources");
  const [type, setType]         = useState("All Types");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [addOpen, setAddOpen]       = useState(false);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editLead, setEditLead]     = useState<Lead | null>(null);
  const [commentLead, setCommentLead] = useState<Lead | null>(null);
  const [comments, setComments]     = useState<Record<number, Comment[]>>({});
  const nextCommentId = useRef(1);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? "Failed to load leads."); setLeads([]); }
      else setLeads((Array.isArray(data) ? data : []).map(toDisplay));
    } catch {
      setApiError("Could not connect to leads API.");
    }
    setLoading(false);
  };

  useEffect(() => { loadLeads(); }, []);

  const handleAdd = async (form: LeadForm) => {
    setSaving(true); setApiError("");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setApiError(data.error); setSaving(false); return; }
    setLeads(prev => [toDisplay(data, 0), ...prev.map((l, i) => toDisplay(l, i + 1))]);
    setAddOpen(false);
    setSaving(false);
  };

  const handleEdit = async (form: LeadForm) => {
    if (!editLead) return;
    setSaving(true); setApiError("");
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editLead.id, ...form }),
    });
    const data = await res.json();
    if (!res.ok) { setApiError(data.error); setSaving(false); return; }
    setLeads(prev => prev.map((l, i) => l.id === editLead.id ? toDisplay(data, i) : l));
    setEditLead(null);
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    const res = await fetch("/api/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { setLeads(prev => prev.filter(l => l.id !== id)); setDeletingId(null); }
  };

  const filtered = leads.filter(l => {
    const matchSrc  = source === "All Sources" || l.source === source;
    const matchType = type   === "All Types"   || l.role   === type;
    const matchSrch = search === "" || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
    return matchSrc && matchType && matchSrch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SELECT_STYLE = {
    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
    backgroundSize: '8px 8px', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Toolbar */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="relative flex items-center h-[34px]">
              <Search size={13} className="absolute left-3" style={{ color: "#94a3b8" }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search leads by name or email..."
                className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none transition-all shadow-sm w-full h-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {/* Source filter */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Source</span>
              <select value={source} onChange={e => { setSource(e.target.value); setPage(1); }}
                className="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer shadow-sm h-[34px] min-w-[140px] appearance-none"
                style={SELECT_STYLE}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Type filter */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</span>
              <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
                className="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer shadow-sm h-[34px] min-w-[120px] appearance-none"
                style={SELECT_STYLE}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <button onClick={() => { setApiError(""); setAddOpen(true); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm h-[34px]"
              style={{ backgroundColor: NAVY }}>
              <Plus size={13} strokeWidth={2.5} />
              Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {apiError && (
        <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-lg">{apiError}</p>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200/50 rounded-xl overflow-hidden flex-1 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-semibold">Loading leads…</span>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                {["#", "Name", "Email", "Phone", "Source", "Type", "Actions"].map(col => (
                  <th key={col} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {rows.map((lead, i) => {
                const avatar = getAvatarStyle(lead.name);
                return (
                  <tr key={lead.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-4 text-[12px] font-medium text-slate-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold tracking-wider uppercase flex-shrink-0 ${avatar.bg}`}>
                          {lead.initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-slate-800 leading-tight">{lead.name}</span>
                          <span className="text-[10.5px] text-slate-400 font-medium mt-0.5">{lead.country || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{lead.email}</td>
                    <td className="px-5 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{lead.phone || "—"}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap"
                        style={{
                          backgroundColor: lead.source === "IntelTrademark" ? "#fef3c750" : lead.source === "Office101" ? "#eff6ff50" : "#f0fdf450",
                          borderColor:     lead.source === "IntelTrademark" ? "#fde68a50" : lead.source === "Office101" ? "#bfdbfe50" : "#bbf7d050",
                          color:           lead.source === "IntelTrademark" ? "#b45309"   : lead.source === "Office101" ? "#1d4ed8"   : "#15803d",
                        }}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[12px] font-medium text-slate-500">{lead.role}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setDetailLead(lead)} title="View"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200/50 transition-all cursor-pointer shadow-sm">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => setCommentLead(lead)} title="Notes"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white text-slate-400 hover:text-amber-600 hover:bg-amber-50/50 hover:border-amber-200/50 transition-all cursor-pointer shadow-sm">
                          <MessageSquare size={13} />
                        </button>
                        <button onClick={() => { setApiError(""); setEditLead(lead); }} title="Edit"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white text-slate-400 hover:text-purple-600 hover:bg-purple-50/50 hover:border-purple-200/50 transition-all cursor-pointer shadow-sm">
                          <Pencil size={13} />
                        </button>
                        {deletingId === lead.id ? (
                          <button onClick={() => handleDelete(lead.id)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100/70 transition-all cursor-pointer shadow-sm">
                            <Check size={11} /> Confirm
                          </button>
                        ) : (
                          <button onClick={() => setDeletingId(lead.id)} title="Delete"
                            className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white text-slate-400 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200/50 transition-all cursor-pointer shadow-sm">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">
                    {search || source !== "All Sources" || type !== "All Types"
                      ? "No leads match your filters."
                      : "No leads yet. Click Add Lead to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between pt-2 pb-1">
          <p className="text-xs text-slate-400">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors disabled:opacity-30 hover:bg-gray-50"
              style={{ borderColor: "#e8edf5" }}>
              <ChevronLeft size={13} style={{ color: "#6b7280" }} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all border"
                style={{
                  backgroundColor: page === n ? NAVY : "#fff",
                  color: page === n ? "#fff" : "#6b7280",
                  borderColor: page === n ? NAVY : "#e8edf5",
                }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors disabled:opacity-30 hover:bg-gray-50"
              style={{ borderColor: "#e8edf5" }}>
              <ChevronRight size={13} style={{ color: "#6b7280" }} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddLeadModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} saving={saving} apiError={apiError} />
      <AddLeadModal open={!!editLead} onClose={() => setEditLead(null)} onAdd={() => {}} initialData={editLead ? toForm(editLead) : undefined} onSave={handleEdit} saving={saving} apiError={apiError} />
      <LeadDetailsModal lead={detailLead} onClose={() => setDetailLead(null)} />
      <AddCommentModal
        leadName={commentLead?.name ?? null}
        comments={commentLead ? (comments[commentLead.id] ?? []) : []}
        onClose={() => setCommentLead(null)}
        onSubmit={text => {
          if (!commentLead) return;
          const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
          const id = nextCommentId.current++;
          setComments(prev => ({ ...prev, [commentLead.id]: [...(prev[commentLead.id] ?? []), { id, text, createdAt: now, done: false }] }));
        }}
        onDelete={id => { if (!commentLead) return; setComments(prev => ({ ...prev, [commentLead.id]: (prev[commentLead.id] ?? []).filter(c => c.id !== id) })); }}
        onToggleDone={id => { if (!commentLead) return; setComments(prev => ({ ...prev, [commentLead.id]: (prev[commentLead.id] ?? []).map(c => c.id === id ? { ...c, done: !c.done } : c) })); }}
        onUpdate={(id, text) => { if (!commentLead) return; setComments(prev => ({ ...prev, [commentLead.id]: (prev[commentLead.id] ?? []).map(c => c.id === id ? { ...c, text } : c) })); }}
      />
    </div>
  );
}

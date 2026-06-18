"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, UserCircle2, Eye, EyeOff, Search as SearchIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const NAVY   = "#161642";
const ACCENT = "#EAB308";

type AgentRole = "Admin" | "Agent";

interface AgentEntry {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  created_at: string;
}

function initials(name: string) {
  return name.trim().split(" ").filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join("") || "?";
}

const getAvatarStyle = (name: string) => {
  const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
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

function Field({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: NAVY }}>{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
          style={{
            border: `1.5px solid ${focused ? ACCENT : "#e2e8f0"}`,
            boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : "none",
            color: NAVY, backgroundColor: "#fff",
            paddingRight: isPassword ? "2.5rem" : undefined,
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "#9ca3af" }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}


interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; email: string; password: string; role: AgentRole }) => Promise<void>;
  initial?: AgentEntry;
  saving: boolean;
  apiError: string;
}

function AgentModal({ open, onClose, onSave, initial, saving, apiError }: ModalProps) {
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [localError, setLocalError] = useState("");

  const isEdit = !!initial;

  useEffect(() => {
    if (!open) return;
    setLocalError("");
    if (initial) {
      setName(initial.name); setEmail(initial.email); setPassword("");
    } else {
      setName(""); setEmail(""); setPassword("");
    }
  }, [open, initial]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;

  const handleSave = async () => {
    setLocalError("");
    if (!name.trim() || !email.trim()) { setLocalError("Name and email are required."); return; }
    if (!isEdit && !password.trim()) { setLocalError("Password is required."); return; }
    if (!email.trim().endsWith("@agent.com")) { setLocalError("Agent email must end with @agent.com"); return; }
    await onSave({ name: name.trim(), email: email.trim(), password: password.trim(), role: "Agent" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.45)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white flex flex-col"
        style={{ border: "1px solid #e8edf5", maxHeight: "90vh" }}>

        <div className="flex items-center justify-between px-8 py-5 border-b flex-shrink-0" style={{ borderColor: "#f1f5f9" }}>
          <h2 className="text-lg font-black" style={{ color: NAVY }}>
            {isEdit ? "Edit Agent" : "Add New Agent"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={16} style={{ color: "#94a3b8" }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-8 py-6 flex flex-col gap-4">
          {(localError || apiError) && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{localError || apiError}</p>
          )}
          <Field label="Full Name" value={name}  onChange={setName}  placeholder="John Doe" />
          <Field label="Email"     value={email} onChange={v => { setEmail(v); setLocalError(""); }} type="email" placeholder="name@agent.com" />
          <Field
            label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
            value={password} onChange={setPassword} type="password"
            placeholder={isEdit ? "Leave blank to keep current" : "Set a password"}
          />

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-full font-black text-sm tracking-widest uppercase transition-opacity hover:opacity-90 mt-1 flex-shrink-0 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: NAVY, color: "#fff" }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : isEdit ? "UPDATE AGENT" : "ADD AGENT"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AgentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [agents, setAgents]         = useState<AgentEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [apiError, setApiError]     = useState("");
  const [modalOpen, setModal]       = useState(false);
  const [editAgent, setEdit]        = useState<AgentEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user && user.role !== "Admin") router.replace("/dashboard/leads");
  }, [user, router]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (!res.ok) { setApiError(data.error ?? "Failed to load agents."); setAgents([]); }
      else setAgents(Array.isArray(data) ? data : []);
    } catch (e) {
      setApiError("Could not connect to agents API. Check your .env.local and restart the server.");
    }
    setLoading(false);
  };

  useEffect(() => { loadAgents(); }, []);

  const handleSave = async (data: { name: string; email: string; password: string; role: AgentRole }) => {
    setSaving(true);
    setApiError("");

    if (editAgent) {
      const res = await fetch("/api/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editAgent.id, name: data.name, role: data.role, password: data.password || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setApiError(json.error); setSaving(false); return; }
      setAgents(p => p.map(a => a.id === editAgent.id ? { ...a, name: data.name, role: data.role } : a));
      setEdit(null);
    } else {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setApiError(json.error); setSaving(false); return; }
      setAgents(p => [...p, json]);
      setModal(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/agents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAgents(p => p.filter(a => a.id !== id));
      setDeletingId(null);
    }
  };

  const filtered = agents.filter(agent =>
    search === ""
    || agent.name.toLowerCase().includes(search.toLowerCase())
    || agent.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Toolbar */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="relative flex items-center h-[34px]">
              <SearchIcon size={13} className="absolute left-3" style={{ color: "#94a3b8" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search agents by name or email..."
                className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:border-yellow-400 transition-all shadow-sm w-full h-full"
              />
            </div>
          </div>

          <button
            onClick={() => { setEdit(null); setApiError(""); setModal(true); }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm h-[34px]"
            style={{ backgroundColor: NAVY }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Agent
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/50 rounded-xl overflow-auto flex-1 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-semibold">Loading agents…</span>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                {["#", "Name", "Email", "Role", "Created At", "Action"].map(col => (
                  <th key={col} className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {filtered.map((agent, i) => {
                const isAdmin = agent.role === "Admin";
                const avatar = getAvatarStyle(agent.name);
                const dateStr = agent.created_at
                  ? new Date(agent.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <tr key={agent.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-4 text-[12px] font-medium text-slate-400">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold tracking-wider uppercase flex-shrink-0 ${avatar.bg}`}>
                          {initials(agent.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-slate-800 leading-tight">{agent.name}</span>
                          <span className="text-[10.5px] text-slate-400 font-medium mt-0.5">{agent.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{agent.email}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap"
                        style={{
                          backgroundColor: isAdmin ? "#eff6ff50" : "#fff7ed50",
                          borderColor:     isAdmin ? "#bfdbfe50" : "#fed7aa50",
                          color:           isAdmin ? "#1d4ed8"   : "#c2410c",
                        }}>
                        {isAdmin ? <ShieldCheck size={11} /> : <UserCircle2 size={11} />}
                        {agent.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{dateStr}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEdit(agent); setApiError(""); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-150 bg-white text-slate-400 hover:text-purple-600 hover:bg-purple-50/50 hover:border-purple-200/50 transition-all cursor-pointer shadow-sm">
                          <Pencil size={13} />
                        </button>
                        {deletingId === agent.id ? (
                          <button onClick={() => handleDelete(agent.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100/70 transition-all cursor-pointer shadow-sm">
                            <Check size={11} /> Confirm
                          </button>
                        ) : (
                          <button onClick={() => setDeletingId(agent.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-150 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200/50 transition-all cursor-pointer shadow-sm">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                    {search ? "No agents match your search." : "No agents yet. Click Add Agent to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AgentModal
        open={modalOpen || !!editAgent}
        onClose={() => { setModal(false); setEdit(null); setApiError(""); }}
        onSave={handleSave}
        initial={editAgent ?? undefined}
        saving={saving}
        apiError={apiError}
      />
    </div>
  );
}

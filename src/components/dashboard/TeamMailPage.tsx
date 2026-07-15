"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Mail, Send, Plus, X, Reply, Search, Star, ChevronRight,
  Loader2, RefreshCw, AlertCircle, Trash2, Check, Settings,
  Pencil, ServerCrash, Inbox,
} from "lucide-react";

const NAVY = "#161642";
const ACCENT = "#2f6bf2";

// ─── Types ────────────────────────────────────────────────
interface Account {
  id: number; label: string; email: string;
  imap_host: string; imap_port: number;
  smtp_host: string; smtp_port: number;
}

interface EmailMsg {
  id: string | number; from: string; fromEmail: string;
  body: string; time: string; type: "received" | "sent";
}

interface Thread {
  id: string | number; leadName: string; leadEmail: string;
  subject: string; unread: boolean; starred: boolean;
  lastTime: string; preview: string; messageId?: string;
  messages: EmailMsg[];
}

type Status = "idle" | "loading" | "loaded" | "error";

// ─── Helpers ──────────────────────────────────────────────
function initials(name: string) {
  return name.trim().split(" ").filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join("") || "?";
}

const AVATAR_PALETTES = [
  "bg-blue-50 text-blue-600 border border-blue-100",
  "bg-emerald-50 text-emerald-600 border border-emerald-100",
  "bg-amber-50 text-amber-600 border border-amber-100",
  "bg-rose-50 text-rose-600 border border-rose-100",
  "bg-purple-50 text-purple-600 border border-purple-100",
  "bg-indigo-50 text-indigo-600 border border-indigo-100",
  "bg-teal-50 text-teal-600 border border-teal-100",
  "bg-sky-50 text-sky-600 border border-sky-100",
];

function avatarCls(name: string) {
  const hash = name.split("").reduce((a, c) => c.charCodeAt(0) + a, 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

const ACCOUNT_COLORS = ["#2f6bf2", "#7c3aed", "#059669", "#d97706", "#e11d48", "#0891b2"];
function accountColor(id: number) { return ACCOUNT_COLORS[id % ACCOUNT_COLORS.length]; }

function ModalField({ label: lbl, value, onChange, placeholder = "", type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lbl}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="px-3 py-2.5 rounded-lg text-sm outline-none border border-slate-200 focus:border-slate-300 text-slate-800 transition-all placeholder-slate-400" />
    </div>
  );
}

// ─── Add / Edit Account Modal ─────────────────────────────
function AccountModal({ open, initial, onClose, onSave }: {
  open: boolean;
  initial?: Account | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [label,    setLabel]    = useState("");
  const [email,    setEmail]    = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");
  const [password, setPassword] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!open) return;
    setLabel(initial?.label ?? "");
    setEmail(initial?.email ?? "");
    setImapHost(initial?.imap_host ?? "");
    setImapPort(String(initial?.imap_port ?? 993));
    setSmtpHost(initial?.smtp_host ?? "");
    setSmtpPort(String(initial?.smtp_port ?? 465));
    setPassword("");
    setError("");
  }, [open, initial]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (!label.trim() || !email.trim() || !imapHost.trim() || !smtpHost.trim()) {
      setError("Label, email, IMAP host and SMTP host are required."); return;
    }
    if (!initial && !password.trim()) { setError("Password is required."); return; }
    setSaving(true); setError("");
    try {
      const method  = initial ? "PATCH" : "POST";
      const payload: Record<string, unknown> = {
        label: label.trim(), email: email.trim(),
        imap_host: imapHost.trim(), imap_port: Number(imapPort) || 993,
        smtp_host: smtpHost.trim(), smtp_port: Number(smtpPort) || 465,
      };
      if (initial) payload.id = initial.id;
      if (password.trim()) payload.password = password.trim();

      const res  = await fetch("/api/team-mail-accounts", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      onSave();
      onClose();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl bg-white border border-slate-100 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings size={14} style={{ color: ACCENT }} />
            <h2 className="text-sm font-black text-slate-800">{initial ? "Edit Account" : "Connect Email Account"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X size={14} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Quick-fill hints */}
          {!initial && (
            <div className="rounded-xl p-3 text-xs text-slate-500" style={{ backgroundColor: "#f0f5ff", border: "1px solid #dbeafe" }}>
              <p className="font-bold text-slate-600 mb-1">Common providers:</p>
              <p><span className="font-semibold">Titan:</span> imap.titan.email / smtp.titan.email</p>
              <p><span className="font-semibold">Gmail:</span> imap.gmail.com / smtp.gmail.com (port 587)</p>
              <p><span className="font-semibold">Outlook:</span> outlook.office365.com / smtp.office365.com (port 587)</p>
            </div>
          )}

          <ModalField label="Display Name" value={label} onChange={setLabel} placeholder="e.g. Support Team" />
          <ModalField label="Email Address" value={email} onChange={setEmail} placeholder="support@yourdomain.com" type="email" />

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><ModalField label="IMAP Host" value={imapHost} onChange={setImapHost} placeholder="imap.titan.email" /></div>
            <ModalField label="IMAP Port" value={imapPort} onChange={setImapPort} placeholder="993" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><ModalField label="SMTP Host" value={smtpHost} onChange={setSmtpHost} placeholder="smtp.titan.email" /></div>
            <ModalField label="SMTP Port" value={smtpPort} onChange={setSmtpPort} placeholder="465" />
          </div>

          <ModalField label={initial ? "New Password (leave blank to keep)" : "Password"} value={password} onChange={setPassword} placeholder="••••••••" type="password" />

          {error && <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: NAVY }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? "Saving…" : initial ? "Update Account" : "Connect Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export function TeamMailPage() {
  const [accounts,      setAccounts]      = useState<Account[]>([]);
  const [loadingAccts,  setLoadingAccts]  = useState(true);
  const [activeId,      setActiveId]      = useState<number | null>(null);

  const [threads,  setThreads]  = useState<Record<number, Thread[]>>({});
  const [statuses, setStatuses] = useState<Record<number, Status>>({});
  const [errors,   setErrors]   = useState<Record<number, string>>({});

  const [selected,       setSelected]       = useState<Thread | null>(null);
  const [reply,          setReply]          = useState("");
  const [search,         setSearch]         = useState("");
  const [sending,        setSending]        = useState(false);
  const [sendError,      setSendError]      = useState("");
  const [deletingId,     setDeletingId]     = useState<string | number | null>(null);
  const [showCompose,    setShowCompose]    = useState(false);
  const [composeTo,      setComposeTo]      = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody,    setComposeBody]    = useState("");
  const [accountModal,   setAccountModal]   = useState<{ open: boolean; item?: Account | null }>({ open: false });
  const [deleteAcctId,   setDeleteAcctId]   = useState<number | null>(null);
  const [deletingAcct,   setDeletingAcct]   = useState(false);

  const msgEndRef = useRef<HTMLDivElement>(null);
  const nextTmpId = useRef(-1);

  const activeAccount = accounts.find(a => a.id === activeId) ?? null;
  const color = activeId ? accountColor(activeId) : ACCENT;

  // ── Load accounts ──────────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setLoadingAccts(true);
    try {
      const res  = await fetch("/api/team-mail-accounts");
      const data = await res.json();
      const list: Account[] = data.accounts ?? [];
      setAccounts(list);
      if (list.length > 0 && activeId === null) setActiveId(list[0].id);
    } catch {}
    setLoadingAccts(false);
  }, [activeId]);

  useEffect(() => { fetchAccounts(); }, []);

  // ── Load emails for an account ─────────────────────────
  const loadEmails = useCallback(async (id: number, force = false) => {
    if (!force && statuses[id] === "loaded") return;
    setStatuses(p => ({ ...p, [id]: "loading" }));
    setErrors(p => ({ ...p, [id]: "" }));
    try {
      const res  = await fetch(`/api/team-mail?accountId=${id}${force ? "&refresh=true" : ""}`);
      const data = await res.json();
      if (!res.ok) {
        setStatuses(p => ({ ...p, [id]: "error" }));
        setErrors(p => ({ ...p, [id]: data.error ?? "Failed to load emails." }));
        return;
      }
      setThreads(p => ({ ...p, [id]: Array.isArray(data) ? data : [] }));
      setStatuses(p => ({ ...p, [id]: "loaded" }));
    } catch {
      setStatuses(p => ({ ...p, [id]: "error" }));
      setErrors(p => ({ ...p, [id]: "Could not reach the email server." }));
    }
  }, [statuses]);

  useEffect(() => {
    if (activeId !== null) {
      setSelected(null); setReply(""); setSendError("");
      loadEmails(activeId);
    }
  }, [activeId]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selected?.messages.length]);

  const curStatus  = activeId ? (statuses[activeId] ?? "idle") : "idle";
  const curThreads = activeId ? (threads[activeId] ?? []) : [];
  const filtered   = curThreads.filter(t =>
    search === "" ||
    t.leadName.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  // ── Send reply ─────────────────────────────────────────
  const handleSendReply = async () => {
    if (!reply.trim() || !selected || !activeId || sending) return;
    setSending(true); setSendError("");
    try {
      const res = await fetch("/api/team-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: activeId, to: selected.leadEmail, subject: `Re: ${selected.subject}`, text: reply.trim(), inReplyTo: selected.messageId }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.error ?? "Failed to send."); setSending(false); return; }

      const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
      const newMsg: EmailMsg = { id: nextTmpId.current--, from: activeAccount?.label ?? "Me", fromEmail: activeAccount?.email ?? "", body: reply.trim(), time: now, type: "sent" };
      setThreads(prev => ({ ...prev, [activeId]: (prev[activeId] ?? []).map(t => t.id === selected.id ? { ...t, messages: [...t.messages, newMsg], unread: false, lastTime: "Just now" } : t) }));
      setSelected(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
      setReply("");
    } catch { setSendError("Could not send. Check your connection."); }
    setSending(false);
  };

  // ── Compose ────────────────────────────────────────────
  const handleComposeSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || !activeId || sending) return;
    setSending(true); setSendError("");
    try {
      const res = await fetch("/api/team-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: activeId, to: composeTo.trim(), subject: composeSubject.trim(), text: composeBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.error ?? "Failed to send."); setSending(false); return; }

      const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
      const newThread: Thread = {
        id: nextTmpId.current--, leadName: composeTo.split("@")[0], leadEmail: composeTo.trim(),
        subject: composeSubject.trim(), unread: false, starred: false, lastTime: "Just now",
        preview: composeBody.trim().slice(0, 80),
        messages: [{ id: nextTmpId.current--, from: activeAccount?.label ?? "Me", fromEmail: activeAccount?.email ?? "", body: composeBody.trim(), time: now, type: "sent" }],
      };
      setThreads(prev => ({ ...prev, [activeId]: [newThread, ...(prev[activeId] ?? [])] }));
      setShowCompose(false); setComposeTo(""); setComposeSubject(""); setComposeBody("");
      setSelected(newThread);
    } catch { setSendError("Could not send."); }
    setSending(false);
  };

  // ── Mark read ──────────────────────────────────────────
  const markAsRead = (t: Thread) => {
    if (!activeId || !t.unread) return;
    setThreads(prev => ({ ...prev, [activeId]: (prev[activeId] ?? []).map(th => th.id === t.id ? { ...th, unread: false } : th) }));
    const uids = t.messages.map(m => m.id).filter(id => typeof id === "string") as string[];
    if (uids.length) fetch("/api/team-mail", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: activeId, uids }) }).catch(() => {});
  };

  // ── Delete thread ──────────────────────────────────────
  const handleDeleteThread = (t: Thread) => {
    if (!activeId) return;
    setThreads(prev => ({ ...prev, [activeId]: (prev[activeId] ?? []).filter(th => th.id !== t.id) }));
    if (selected?.id === t.id) setSelected(null);
    setDeletingId(null);
    const uids = t.messages.map(m => m.id).filter(id => typeof id === "string") as string[];
    if (uids.length) fetch("/api/team-mail", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: activeId, uids }) }).catch(() => {});
  };

  // ── Star ───────────────────────────────────────────────
  const toggleStar = (threadId: string | number, e: React.MouseEvent) => {
    if (!activeId) return;
    e.stopPropagation();
    setThreads(prev => ({ ...prev, [activeId]: (prev[activeId] ?? []).map(t => t.id === threadId ? { ...t, starred: !t.starred } : t) }));
    if (selected?.id === threadId) setSelected(p => p ? { ...p, starred: !p.starred } : p);
  };

  // ── Delete account ─────────────────────────────────────
  const handleDeleteAccount = async (id: number) => {
    setDeletingAcct(true);
    await fetch(`/api/team-mail-accounts?id=${id}`, { method: "DELETE" });
    if (activeId === id) { setActiveId(null); setSelected(null); }
    await fetchAccounts();
    setDeleteAcctId(null);
    setDeletingAcct(false);
  };

  // ── No accounts empty state ────────────────────────────
  if (!loadingAccts && accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8" style={{ backgroundColor: "#f8fafc" }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: "#eef4ff" }}>
          <Inbox size={36} style={{ color: ACCENT }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black" style={{ color: NAVY }}>No email accounts connected</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
            Connect your Titan, Gmail, or any IMAP email account to manage correspondence from here.
          </p>
        </div>
        <button
          onClick={() => setAccountModal({ open: true, item: null })}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-black text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: NAVY }}>
          <Plus size={16} strokeWidth={3} /> Connect Email Account
        </button>
        <AccountModal open={accountModal.open} initial={accountModal.item} onClose={() => setAccountModal({ open: false })} onSave={fetchAccounts} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0" style={{ height: "calc(100vh - 65px)", margin: "-1.75rem" }}>

      {/* ── Tabs bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0 gap-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
          {loadingAccts ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" /> Loading…</div>
          ) : (
            accounts.map(acc => {
              const isActive = activeId === acc.id;
              const col = accountColor(acc.id);
              const unread = (threads[acc.id] ?? []).filter(t => t.unread).length;
              return (
                <button key={acc.id} onClick={() => setActiveId(acc.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 cursor-pointer ${
                    isActive ? "bg-slate-50 text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50 border border-transparent"
                  }`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
                  <span className="max-w-[120px] truncate">{acc.label}</span>
                  {unread > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: col }}>{unread}</span>
                  )}
                  {/* Edit/delete on hover */}
                  {isActive && (
                    <span className="flex items-center gap-0.5 ml-0.5">
                      <span onClick={e => { e.stopPropagation(); setAccountModal({ open: true, item: acc }); }}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer">
                        <Pencil size={10} style={{ color: "#94a3b8" }} />
                      </span>
                      {deleteAcctId === acc.id ? (
                        <>
                          <span onClick={e => { e.stopPropagation(); handleDeleteAccount(acc.id); }}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white cursor-pointer">
                            {deletingAcct ? <Loader2 size={9} className="animate-spin" /> : <><Check size={9} /> Yes</>}
                          </span>
                          <span onClick={e => { e.stopPropagation(); setDeleteAcctId(null); }}
                            className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 cursor-pointer">
                            <X size={10} style={{ color: "#94a3b8" }} />
                          </span>
                        </>
                      ) : (
                        <span onClick={e => { e.stopPropagation(); setDeleteAcctId(acc.id); }}
                          className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-50 transition-colors cursor-pointer">
                          <Trash2 size={10} style={{ color: "#f87171" }} />
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })
          )}
          <button onClick={() => setAccountModal({ open: true, item: null })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-dashed border-slate-200 transition-all flex-shrink-0 cursor-pointer">
            <Plus size={12} strokeWidth={3} /> Add Account
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {curStatus === "loaded" && activeId && (
            <button onClick={() => loadEmails(activeId, true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
              <RefreshCw size={13} />
            </button>
          )}
          {curStatus === "loaded" && activeId && (
            <button onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm"
              style={{ backgroundColor: NAVY }}>
              <Plus size={14} strokeWidth={2.5} /> Compose
            </button>
          )}
        </div>
      </div>

      {/* ── Main panel ───────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden bg-slate-50/50">

        {curStatus === "loading" && (
          <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-semibold">Loading emails…</span>
          </div>
        )}

        {curStatus === "error" && activeId && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm text-center flex flex-col items-center gap-5 bg-white rounded-2xl p-8 border border-red-100 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <ServerCrash size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 mb-1">Could Not Load Emails</p>
                <p className="text-xs text-slate-400 leading-relaxed">{errors[activeId]}</p>
              </div>
              <button onClick={() => loadEmails(activeId, true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer"
                style={{ backgroundColor: NAVY }}>
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          </div>
        )}

        {(curStatus === "loaded" || curStatus === "idle") && (
          <>
            {/* Thread list */}
            <div className="w-[320px] flex-shrink-0 flex flex-col bg-white border-r border-slate-100">
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/70 border border-slate-200/20 focus-within:bg-white transition-all">
                  <Search size={14} className="text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search conversations…"
                    className="text-xs outline-none bg-transparent flex-1 text-slate-800 placeholder-slate-400" />
                  {search && <button onClick={() => setSearch("")}><X size={12} className="text-slate-400 hover:text-slate-600" /></button>}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/40">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">No emails found</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{search ? "Try a different search term" : "Your inbox is empty"}</p>
                    </div>
                  </div>
                ) : (
                  filtered.map(t => {
                    const isActive = selected?.id === t.id;
                    return (
                      <div key={t.id} role="button" tabIndex={0}
                        onClick={() => { setSelected(t); markAsRead(t); setDeletingId(null); }}
                        onKeyDown={e => { if (e.key === "Enter") e.currentTarget.click(); }}
                        style={{ borderLeftColor: isActive ? color : "transparent" }}
                        className={`w-full text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer border-l-4 border-t border-r border-b relative group ${
                          isActive
                            ? "bg-white shadow-md shadow-slate-100/50 border-t-slate-200/50 border-r-slate-200/50 border-b-slate-200/50"
                            : "bg-white/80 border-t-slate-100 border-r-slate-100 border-b-slate-100 hover:bg-white hover:shadow-sm"
                        }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarCls(t.leadName)}`}>
                            {initials(t.leadName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`text-xs truncate ${t.unread ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>{t.leadName}</span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {t.unread && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
                                <span className="text-[10px] text-slate-400 font-semibold">{t.lastTime}</span>
                                <button onClick={e => toggleStar(t.id, e)} className="text-slate-300 hover:text-amber-500 transition-colors">
                                  <Star size={12} fill={t.starred ? "#f59e0b" : "none"} style={{ color: t.starred ? "#f59e0b" : "currentColor" }} />
                                </button>
                                {deletingId === t.id ? (
                                  <button onClick={e => { e.stopPropagation(); handleDeleteThread(t); }}
                                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500 text-white cursor-pointer">
                                    <Check size={9} /> Yes
                                  </button>
                                ) : (
                                  <button onClick={e => { e.stopPropagation(); setDeletingId(t.id); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all cursor-pointer">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className={`text-xs truncate mb-1 ${t.unread ? "font-bold text-slate-800" : "font-medium text-slate-500"}`}>{t.subject}</p>
                            <p className="text-[11px] text-slate-400 truncate">{t.preview}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Thread detail */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {!selected ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Mail size={24} className="text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Select an email</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">Pick a conversation from the list to read and reply.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100">
                        <Mail size={12} style={{ color }} />
                      </div>
                      <span className="text-xs font-bold text-slate-400">Inbox</span>
                      <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate">{selected.subject}</span>
                    </div>
                    <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 bg-slate-50/20">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarCls(selected.leadName)}`}>
                        {initials(selected.leadName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold" style={{ color: NAVY }}>{selected.leadName}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-400">{selected.leadEmail}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{selected.lastTime}</p>
                      </div>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 mb-6">{selected.subject}</h2>

                    <div className="flex flex-col gap-4">
                      {selected.messages.map((msg, idx) => {
                        const isSent = msg.type === "sent";
                        const prev   = idx > 0 ? selected.messages[idx - 1] : null;
                        const showSep = idx > 0 && prev?.type !== msg.type;
                        return (
                          <div key={msg.id} className="flex flex-col gap-1">
                            {showSep && (
                              <div className="flex items-center gap-3 py-1 my-1">
                                <div className="flex-1 h-px bg-slate-100" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.time}</span>
                                <div className="flex-1 h-px bg-slate-100" />
                              </div>
                            )}
                            <div className={`flex items-end gap-2.5 ${isSent ? "flex-row-reverse" : ""}`}>
                              {!isSent ? (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${avatarCls(msg.from)}`}>
                                  {initials(msg.from)}
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border"
                                  style={{ backgroundColor: `${color}15`, color, borderColor: `${color}30` }}>
                                  {initials(activeAccount?.label ?? "Me")}
                                </div>
                              )}
                              <div className={`flex flex-col gap-1 max-w-[68%] ${isSent ? "items-end" : "items-start"}`}>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] font-bold text-slate-600">{isSent ? (activeAccount?.label ?? "Me") : msg.from}</span>
                                  <span className="text-[10px] text-slate-400">{msg.time}</span>
                                </div>
                                <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${isSent ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm border border-slate-100"}`}
                                  style={{ backgroundColor: isSent ? color : "#ffffff", color: isSent ? "#ffffff" : "#374151" }}>
                                  {msg.body}
                                </div>
                                <p className="text-[10px] text-slate-400">{msg.fromEmail}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div ref={msgEndRef} />
                  </div>

                  {/* Reply box */}
                  <div className="flex-shrink-0 border-t border-slate-100 p-6 bg-white">
                    {sendError && <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{sendError}</p>}
                    <div className="flex items-center gap-2 mb-3">
                      <Reply size={14} style={{ color }} />
                      <span className="text-xs font-black" style={{ color }}>Reply to {selected.leadName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">from {activeAccount?.email ?? ""}</span>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition-all bg-slate-50/20">
                      <textarea value={reply} onChange={e => setReply(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply(); }}
                        placeholder="Type your reply… (Ctrl+Enter to send)" rows={3}
                        className="w-full px-4 py-3 text-sm outline-none resize-none bg-transparent text-slate-800 placeholder-slate-400" />
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-200/50">
                        <span className="text-[10px] text-slate-400 font-bold">Ctrl+Enter to send</span>
                        <button onClick={handleSendReply} disabled={!reply.trim() || sending}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs text-white transition-all hover:opacity-90 disabled:opacity-40 cursor-pointer"
                          style={{ backgroundColor: color }}>
                          {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          {sending ? "Sending…" : "Send Reply"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Compose modal */}
      {showCompose && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowCompose(false); }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl bg-white border border-slate-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Mail size={12} style={{ color }} />
                <h2 className="text-sm font-black text-slate-800">New Message</h2>
              </div>
              <button onClick={() => setShowCompose(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {sendError && <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{sendError}</p>}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</label>
                <div className="px-4 py-2.5 rounded-lg text-sm bg-slate-50 border border-slate-200 text-slate-600 font-semibold">{activeAccount.email}</div>
              </div>
              {[{ label: "To", value: composeTo, set: setComposeTo, placeholder: "recipient@example.com" }, { label: "Subject", value: composeSubject, set: setComposeSubject, placeholder: "Enter subject" }].map(f => (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    className="px-4 py-2.5 rounded-lg text-sm outline-none border border-slate-200 focus:border-slate-300 text-slate-800 transition-all placeholder-slate-400" />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message</label>
                <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your message…" rows={5}
                  className="px-4 py-3 rounded-lg text-sm outline-none border border-slate-200 focus:border-slate-300 text-slate-800 resize-none placeholder-slate-400" />
              </div>
              <button onClick={handleComposeSend} disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: color }}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AccountModal open={accountModal.open} initial={accountModal.item} onClose={() => setAccountModal({ open: false })} onSave={fetchAccounts} />
    </div>
  );
}

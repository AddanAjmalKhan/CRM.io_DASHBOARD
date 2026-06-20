"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mail, Send, Plus, X, Reply, Search, ArrowUpDown, Star, ChevronRight, Loader2, RefreshCw, AlertCircle } from "lucide-react";

const NAVY = "#161642";

interface EmailMsg {
  id: number;
  from: string;
  fromEmail: string;
  body: string;
  time: string;
  type: "received" | "sent";
}

interface Thread {
  id: number;
  leadName: string;
  leadEmail: string;
  subject: string;
  unread: boolean;
  starred: boolean;
  lastTime: string;
  preview: string;
  tag?: string;
  messageId?: string;
  messages: EmailMsg[];
}

type Website  = "IntelTrademark" | "Office101" | "Office102";
type Status   = "idle" | "loading" | "loaded" | "error";

const WEBSITE_META: Record<Website, { label: string; email: string; color: string; bg: string; lightBg: string }> = {
  IntelTrademark: { label: "IntelTrademark",  email: "Info@inteltrademark.com",  color: "#7c3aed", bg: "#ede9fe", lightBg: "#faf8ff" },
  Office101:      { label: "Office 101 LLC",  email: "info@office101llc.com",   color: "#2563eb", bg: "#dbeafe", lightBg: "#f5f8ff" },
  Office102:      { label: "Office 102 LLC",  email: "Info@office102llc.com",   color: "#059669", bg: "#d1fae5", lightBg: "#f2fdf8" },
};

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

export function EmailsPage() {
  const [activeWebsite, setActiveWebsite] = useState<Website>("IntelTrademark");
  const [threads,  setThreads]  = useState<Record<Website, Thread[]>>({ IntelTrademark: [], Office101: [], Office102: [] });
  const [statuses, setStatuses] = useState<Record<Website, Status>>({ IntelTrademark: "idle", Office101: "idle", Office102: "idle" });
  const [errors,   setErrors]   = useState<Record<Website, string>>({ IntelTrademark: "", Office101: "", Office102: "" });
  const [selected, setSelected] = useState<Thread | null>(null);
  const [reply,    setReply]    = useState("");
  const [search,   setSearch]   = useState("");
  const [sending,  setSending]  = useState(false);
  const [sendError, setSendError] = useState("");
  const [showCompose, setShowCompose]       = useState(false);
  const [composeTo, setComposeTo]           = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody]       = useState("");
  const msgEndRef  = useRef<HTMLDivElement>(null);
  const nextTmpId  = useRef(-1);

  const meta = WEBSITE_META[activeWebsite];

  const loadEmails = useCallback(async (account: Website, force = false) => {
    if (!force && statuses[account] === "loaded") return;
    setStatuses(p => ({ ...p, [account]: "loading" }));
    setErrors(p => ({ ...p, [account]: "" }));
    try {
      const res  = await fetch(`/api/emails?account=${account}`);
      const data = await res.json();
      if (!res.ok) {
        setStatuses(p => ({ ...p, [account]: "error" }));
        setErrors(p => ({ ...p, [account]: data.error ?? "Failed to load emails." }));
        return;
      }
      setThreads(p => ({ ...p, [account]: Array.isArray(data) ? data : [] }));
      setStatuses(p => ({ ...p, [account]: "loaded" }));
    } catch {
      setStatuses(p => ({ ...p, [account]: "error" }));
      setErrors(p => ({ ...p, [account]: "Could not reach the email server." }));
    }
  }, [statuses]);

  useEffect(() => { loadEmails("IntelTrademark"); }, []);

  useEffect(() => {
    setSelected(null);
    setReply("");
    setSendError("");
    loadEmails(activeWebsite);
  }, [activeWebsite]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length]);

  const currentStatus = statuses[activeWebsite];

  const filteredThreads = threads[activeWebsite].filter(t =>
    search === "" ||
    t.leadName.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendReply = async () => {
    if (!reply.trim() || !selected || sending) return;
    setSending(true); setSendError("");
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: activeWebsite,
          to:      selected.leadEmail,
          subject: `Re: ${selected.subject}`,
          text:    reply.trim(),
          inReplyTo: selected.messageId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.error ?? "Failed to send."); setSending(false); return; }

      const now    = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
      const newMsg: EmailMsg = { id: nextTmpId.current--, from: meta.label, fromEmail: meta.email, body: reply.trim(), time: now, type: "sent" };
      setThreads(prev => ({
        ...prev,
        [activeWebsite]: prev[activeWebsite].map(t =>
          t.id === selected.id
            ? { ...t, messages: [...t.messages, newMsg], unread: false, lastTime: "Just now", preview: reply.trim().slice(0, 80) }
            : t
        ),
      }));
      setSelected(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
      setReply("");
    } catch { setSendError("Could not send. Check your connection."); }
    setSending(false);
  };

  const handleComposeSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || sending) return;
    setSending(true); setSendError("");
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: activeWebsite, to: composeTo.trim(), subject: composeSubject.trim(), text: composeBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.error ?? "Failed to send."); setSending(false); return; }

      const now    = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
      const newThread: Thread = {
        id: nextTmpId.current--,
        leadName: composeTo.split("@")[0], leadEmail: composeTo.trim(),
        subject: composeSubject.trim(), unread: false, starred: false,
        lastTime: "Just now", preview: composeBody.trim().slice(0, 80),
        messages: [{ id: nextTmpId.current--, from: meta.label, fromEmail: meta.email, body: composeBody.trim(), time: now, type: "sent" }],
      };
      setThreads(prev => ({ ...prev, [activeWebsite]: [newThread, ...prev[activeWebsite]] }));
      setShowCompose(false); setComposeTo(""); setComposeSubject(""); setComposeBody("");
      setSelected(newThread);
    } catch { setSendError("Could not send. Check your connection."); }
    setSending(false);
  };

  const toggleStar = (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => ({ ...prev, [activeWebsite]: prev[activeWebsite].map(t => t.id === threadId ? { ...t, starred: !t.starred } : t) }));
    if (selected?.id === threadId) setSelected(prev => prev ? { ...prev, starred: !prev.starred } : prev);
  };

  return (
    <div className="flex flex-col h-full gap-0 -m-7" style={{ margin: 0 }}>

      {/* Tabs bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          {(Object.keys(WEBSITE_META) as Website[]).map(w => {
            const m = WEBSITE_META[w];
            const isActive = activeWebsite === w;
            const unread = threads[w].filter(t => t.unread).length;
            return (
              <button key={w} onClick={() => setActiveWebsite(w)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-slate-50 text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50 border border-transparent"
                }`}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: m.color }} />
                {m.label}
                {unread > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-0.5" style={{ backgroundColor: m.color }}>
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {currentStatus === "loaded" && (
            <button onClick={() => loadEmails(activeWebsite, true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
              <RefreshCw size={13} />
            </button>
          )}
          {currentStatus === "loaded" && (
            <button onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm"
              style={{ backgroundColor: NAVY }}>
              <Plus size={14} strokeWidth={2.5} /> Compose
            </button>
          )}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex flex-1 overflow-hidden bg-slate-50/50">

        {/* Loading state */}
        {currentStatus === "loading" && (
          <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-semibold">Loading emails…</span>
          </div>
        )}

        {/* Error state */}
        {currentStatus === "error" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm text-center flex flex-col items-center gap-5 bg-white rounded-2xl p-8 border border-red-100 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 mb-1">Could Not Load Emails</p>
                <p className="text-xs text-slate-400 leading-relaxed">{errors[activeWebsite]}</p>
              </div>
              <button onClick={() => loadEmails(activeWebsite, true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer"
                style={{ backgroundColor: NAVY }}>
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Loaded state */}
        {(currentStatus === "loaded" || currentStatus === "idle") && (
          <>
            {/* Left: thread list */}
            <div className="w-[320px] flex-shrink-0 flex flex-col bg-white border-r border-slate-100">
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-extrabold text-sm tracking-tight">Inbox</span>
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                    <ArrowUpDown size={12} className="text-slate-400" /> Sort
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/70 border border-slate-200/20 focus-within:bg-white transition-all">
                  <Search size={14} className="text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="text-xs outline-none bg-transparent flex-1 text-slate-800 placeholder-slate-400" />
                  {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/40">
                {filteredThreads.length === 0 ? (
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
                  filteredThreads.map(t => {
                    const isActive = selected?.id === t.id;
                    const avatar   = getAvatarStyle(t.leadName);
                    return (
                      <div key={t.id} role="button" tabIndex={0}
                        onClick={() => {
                          setSelected(t);
                          setThreads(prev => ({
                            ...prev,
                            [activeWebsite]: prev[activeWebsite].map(th => th.id === t.id ? { ...th, unread: false } : th),
                          }));
                        }}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") e.currentTarget.click(); }}
                        className={`w-full text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer border relative overflow-hidden ${
                          isActive
                            ? "bg-white shadow-md shadow-slate-100/50 border-slate-200/50"
                            : "bg-white/80 border-slate-100 hover:border-slate-200/60 hover:bg-white hover:shadow-sm"
                        }`}>
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: meta.color }} />}
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatar.bg}`}>
                            {initials(t.leadName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`text-xs truncate ${t.unread ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
                                {t.leadName}
                              </span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {t.unread && <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />}
                                <span className="text-[10px] text-slate-400 font-semibold">{t.lastTime}</span>
                                <button onClick={e => { e.stopPropagation(); toggleStar(t.id, e); }} className="text-slate-300 hover:text-amber-500 transition-colors">
                                  <Star size={12} fill={t.starred ? "#f59e0b" : "none"} style={{ color: t.starred ? "#f59e0b" : "currentColor" }} />
                                </button>
                              </div>
                            </div>
                            <p className={`text-xs truncate mb-1 ${t.unread ? "font-bold text-slate-800" : "font-medium text-slate-500"}`}>{t.subject}</p>
                            <p className="text-[11px] leading-relaxed text-slate-400 truncate">{t.preview}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: email detail */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {!selected ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-slate-50/10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                    <Mail size={24} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Select an email conversation</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Select an email thread from the list on the left to read messages and reply.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header bar */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 flex-shrink-0">
                        <Mail size={12} style={{ color: meta.color }} />
                      </div>
                      <span className="text-xs font-bold text-slate-400">Inbox</span>
                      <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate">{selected.subject}</span>
                    </div>
                    <button onClick={() => setSelected(null)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100 cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50/20">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarStyle(selected.leadName).bg}`}>
                          {initials(selected.leadName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold" style={{ color: NAVY }}>{selected.leadName}</span>
                            <span className="text-xs text-slate-400">to</span>
                            <span className="text-xs font-bold text-slate-600">{meta.label}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">{selected.leadEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button onClick={e => toggleStar(selected.id, e)} className="text-slate-300 hover:text-amber-500 transition-colors">
                          <Star size={16} fill={selected.starred ? "#f59e0b" : "none"} style={{ color: selected.starred ? "#f59e0b" : "currentColor" }} />
                        </button>
                        <span className="text-xs font-semibold text-slate-400">{selected.lastTime}</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">{selected.subject}</h2>

                    <div className="flex flex-col gap-4">
                      {selected.messages.map((msg, idx) => {
                        const isSent = msg.type === "sent";
                        const prevMsg = idx > 0 ? selected.messages[idx - 1] : null;
                        const showTime = idx === 0 || prevMsg?.type !== msg.type;
                        return (
                          <div key={msg.id} className="flex flex-col gap-1">
                            {/* Time separator between sender switches */}
                            {idx > 0 && showTime && (
                              <div className="flex items-center gap-3 py-1 my-1">
                                <div className="flex-1 h-px bg-slate-100" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.time}</span>
                                <div className="flex-1 h-px bg-slate-100" />
                              </div>
                            )}
                            <div className={`flex items-end gap-2.5 ${isSent ? "flex-row-reverse" : ""}`}>
                              {/* Avatar */}
                              {!isSent ? (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getAvatarStyle(msg.from).bg}`}>
                                  {initials(msg.from)}
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border"
                                  style={{ backgroundColor: meta.bg, color: meta.color, borderColor: `${meta.color}30` }}>
                                  {initials(meta.label)}
                                </div>
                              )}
                              {/* Bubble */}
                              <div className={`flex flex-col gap-1 max-w-[68%] ${isSent ? "items-end" : "items-start"}`}>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] font-bold text-slate-600">{isSent ? meta.label : msg.from}</span>
                                  <span className="text-[10px] text-slate-400">{msg.time}</span>
                                </div>
                                <div
                                  className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                                    isSent
                                      ? "rounded-2xl rounded-br-sm"
                                      : "rounded-2xl rounded-bl-sm border border-slate-100"
                                  }`}
                                  style={{
                                    backgroundColor: isSent ? meta.color : "#ffffff",
                                    color: isSent ? "#ffffff" : "#374151",
                                  }}>
                                  {msg.body}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">{msg.fromEmail}</p>
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
                    {sendError && (
                      <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{sendError}</p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <Reply size={14} style={{ color: meta.color }} />
                      <span className="text-xs font-black" style={{ color: meta.color }}>Reply to {selected.leadName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">from {meta.email}</span>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition-all bg-slate-50/20">
                      <textarea value={reply} onChange={e => setReply(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply(); }}
                        placeholder="Type your reply here... (Ctrl+Enter to send)"
                        rows={3}
                        className="w-full px-4 py-3 text-sm outline-none resize-none bg-transparent text-slate-800 placeholder-slate-400 border-none" />
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-200/50">
                        <span className="text-[10px] text-slate-400 font-bold">Ctrl+Enter to send</span>
                        <button onClick={handleSendReply} disabled={!reply.trim() || sending}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs text-white transition-all hover:opacity-90 disabled:opacity-40 cursor-pointer shadow-sm"
                          style={{ backgroundColor: meta.color }}>
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
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowCompose(false); }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl bg-white border border-slate-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Mail size={12} style={{ color: meta.color }} />
                <h2 className="text-sm font-black text-slate-800">Compose New Message</h2>
              </div>
              <button onClick={() => setShowCompose(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {sendError && <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{sendError}</p>}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</label>
                <div className="px-4 py-2.5 rounded-lg text-sm bg-slate-50 border border-slate-200 text-slate-600 font-semibold select-none">{meta.email}</div>
              </div>
              {[
                { label: "To", value: composeTo, set: setComposeTo, placeholder: "recipient@example.com" },
                { label: "Subject", value: composeSubject, set: setComposeSubject, placeholder: "Enter subject" },
              ].map(f => (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    className="px-4 py-2.5 rounded-lg text-sm outline-none border border-slate-200 focus:border-slate-300 text-slate-800 transition-all placeholder-slate-400" />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message</label>
                <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your message..." rows={5}
                  className="px-4 py-3 rounded-lg text-sm outline-none border border-slate-200 focus:border-slate-300 text-slate-800 resize-none placeholder-slate-400" />
              </div>
              <button onClick={handleComposeSend} disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white text-sm tracking-widest uppercase hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: meta.color }}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? "Sending…" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

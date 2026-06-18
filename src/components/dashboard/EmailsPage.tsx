"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mail, Send, Plus, Link2, X, Reply,
  Search, ArrowUpDown, Star, ChevronRight,
} from "lucide-react";

const NAVY   = "#161642";
const ACCENT = "#2f6bf2";

/* ─── Types ─────────────────────────────────────────── */
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
  messages: EmailMsg[];
}

type Website = "IntelTrademark" | "Office101" | "Office102";

const WEBSITE_META: Record<Website, { label: string; email: string; color: string; bg: string; lightBg: string }> = {
  IntelTrademark: { label: "IntelTrademark", email: "info@inteltrademark.com", color: "#7c3aed", bg: "#ede9fe", lightBg: "#faf8ff" },
  Office101:      { label: "Office 101 LLC", email: "info@office101llc.com",   color: "#2563eb", bg: "#dbeafe", lightBg: "#f5f8ff" },
  Office102:      { label: "Office 102 LLC", email: "info@office102llc.com",   color: "#059669", bg: "#d1fae5", lightBg: "#f2fdf8" },
};

/* ─── Seed data ─────────────────────────────────────── */
const SEED: Record<Website, Thread[]> = {
  IntelTrademark: [
    {
      id: 1, leadName: "Lettie Jimenez", leadEmail: "jimenez@gmail.com", starred: true,
      subject: "Trademark Registration Inquiry", unread: true, lastTime: "10:23 am",
      preview: "Hi, I wanted to follow up on my trademark application for ZenBrew. It has been 3 weeks.",
      tag: "Inquiry",
      messages: [
        { id: 1, from: "Lettie Jimenez",  fromEmail: "jimenez@gmail.com",         body: "Hi, I wanted to follow up on my trademark application for 'ZenBrew'. It has been 3 weeks and I haven't received any updates. Could you please let me know the current status?", time: "May 23, 10:23 am", type: "received" },
        { id: 2, from: "Intel Trademark", fromEmail: "info@inteltrademark.com",    body: "Hi Lettie,\n\nThank you for reaching out. Your application for 'ZenBrew' is currently in the examination phase. The USPTO typically takes 3–4 months for initial review. We will notify you as soon as we receive an update.\n\nBest regards,\nIntelTrademark Team", time: "May 23, 11:45 am", type: "sent" },
        { id: 3, from: "Lettie Jimenez",  fromEmail: "jimenez@gmail.com",         body: "Thank you for the update! Is there anything I need to prepare in the meantime?", time: "May 23, 12:10 pm", type: "received" },
      ],
    },
    {
      id: 2, leadName: "Frank Underwood", leadEmail: "frank@gmail.com", starred: false,
      subject: "Invoice Payment Confirmation", unread: false, lastTime: "Yesterday",
      preview: "Please find attached the payment receipt for invoice #TO-AN-2602-16099.",
      tag: "Payment",
      messages: [
        { id: 1, from: "Frank Underwood", fromEmail: "frank@gmail.com",           body: "Hello,\n\nPlease find attached the payment receipt for invoice #TO-AN-2602-16099. Could you confirm receipt and send me an official acknowledgment?", time: "Jun 7, 2:15 pm", type: "received" },
        { id: 2, from: "Intel Trademark", fromEmail: "info@inteltrademark.com",   body: "Hi Frank,\n\nPayment received and confirmed. Your official receipt has been emailed to your address. Your case has been marked as paid and processing will begin within 2 business days.\n\nThank you!", time: "Jun 7, 3:00 pm", type: "sent" },
      ],
    },
    {
      id: 3, leadName: "Amanda Kim", leadEmail: "amanda@gmail.com", starred: true,
      subject: "Question about trademark classes", unread: true, lastTime: "Jun 6",
      preview: "I want to register my brand NovaSkin in both cosmetics and wellness spa services.",
      tag: "Question",
      messages: [
        { id: 1, from: "Amanda Kim", fromEmail: "amanda@gmail.com",               body: "Hi,\n\nI want to register my brand 'NovaSkin' in both cosmetics and wellness/spa services. How many trademark classes would I need, and what would be the total cost?", time: "Jun 6, 9:00 am", type: "received" },
      ],
    },
  ],
  Office101: [
    {
      id: 4, leadName: "Dennis Castillo", leadEmail: "dennis@gmail.com", starred: false,
      subject: "LLC Formation Documents", unread: true, lastTime: "9:14 am",
      preview: "I received the documents but page 4 of the operating agreement seems to be missing.",
      tag: "Documents",
      messages: [
        { id: 1, from: "Dennis Castillo", fromEmail: "dennis@gmail.com",          body: "Good morning,\n\nI received the LLC formation documents via email but page 4 of the operating agreement seems to be missing. Could you resend the complete document?", time: "Jun 8, 9:14 am", type: "received" },
        { id: 2, from: "Office 101",      fromEmail: "info@office101llc.com",     body: "Hi Dennis,\n\nApologies for the inconvenience! We've re-sent the complete operating agreement with all pages. Please check your inbox and let us know if everything looks correct.", time: "Jun 8, 9:45 am", type: "sent" },
        { id: 3, from: "Dennis Castillo", fromEmail: "dennis@gmail.com",          body: "Got it, all pages are there now. Thank you so much for the quick response!", time: "Jun 8, 10:02 am", type: "received" },
      ],
    },
    {
      id: 5, leadName: "Gabriel Cox", leadEmail: "cox@gmail.com", starred: true,
      subject: "Annual Report Filing Deadline", unread: false, lastTime: "Jun 5",
      preview: "This is a friendly reminder that your LLC annual report is due on June 30, 2026.",
      tag: "Reminder",
      messages: [
        { id: 1, from: "Office 101",  fromEmail: "info@office101llc.com",         body: "Hi Gabriel,\n\nThis is a friendly reminder that your LLC annual report is due on June 30, 2026. Filing on time avoids late fees. Please log in to your client portal to review and submit.\n\nBest,\nOffice 101 Team", time: "Jun 5, 11:00 am", type: "sent" },
        { id: 2, from: "Gabriel Cox", fromEmail: "cox@gmail.com",                 body: "Thanks for the heads up! I'll take care of it this week.", time: "Jun 5, 1:30 pm", type: "received" },
      ],
    },
    {
      id: 6, leadName: "Sophia Murphy", leadEmail: "murphy@gmail.com", starred: false,
      subject: "Registered Agent Change Request", unread: true, lastTime: "Jun 4",
      preview: "We recently moved our business and need to update the registered agent address.",
      tag: "Request",
      messages: [
        { id: 1, from: "Sophia Murphy", fromEmail: "murphy@gmail.com",            body: "Hello,\n\nWe recently moved our business and need to update the registered agent address on file with the state. What is the process for this and are there any fees involved?", time: "Jun 4, 3:22 pm", type: "received" },
      ],
    },
  ],
  Office102: [
    {
      id: 7, leadName: "Craig Perkins", leadEmail: "cperkins@gmail.com", starred: false,
      subject: "Business License Renewal", unread: false, lastTime: "Jun 7",
      preview: "We have submitted your renewal application to the city clerk's office.",
      tag: "Update",
      messages: [
        { id: 1, from: "Craig Perkins", fromEmail: "cperkins@gmail.com",          body: "Hi,\n\nI wanted to check the status of our business license renewal that we submitted last month.", time: "Jun 6, 2:00 pm", type: "received" },
        { id: 2, from: "Office 102",    fromEmail: "info@office102llc.com",       body: "Hi Craig,\n\nYour renewal application has been submitted to the city clerk's office and is currently under review. Processing typically takes 10–15 business days. We'll send you the renewed license as soon as it's approved.", time: "Jun 7, 9:30 am", type: "sent" },
        { id: 3, from: "Craig Perkins", fromEmail: "cperkins@gmail.com",          body: "Great, thank you. Please keep me posted.", time: "Jun 7, 10:15 am", type: "received" },
      ],
    },
    {
      id: 8, leadName: "Eunice Fleming", leadEmail: "eunice@gmail.com", starred: true,
      subject: "EIN Application Status", unread: true, lastTime: "Jun 6",
      preview: "I applied for an EIN last week and haven't received it yet. Could you check on this?",
      tag: "Inquiry",
      messages: [
        { id: 1, from: "Eunice Fleming", fromEmail: "eunice@gmail.com",           body: "Hello,\n\nI applied for an EIN through your service last week and haven't received it yet. The IRS usually issues it the same day. Could you check on this?", time: "Jun 6, 4:10 pm", type: "received" },
      ],
    },
    {
      id: 9, leadName: "Marcus Hill", leadEmail: "marcus@gmail.com", starred: false,
      subject: "Operating Agreement Customization", unread: false, lastTime: "Jun 3",
      preview: "We'd like to add custom clauses regarding profit distribution and member buyout.",
      tag: "Request",
      messages: [
        { id: 1, from: "Marcus Hill", fromEmail: "marcus@gmail.com",              body: "Hi,\n\nWe'd like to add a few custom clauses to our operating agreement regarding profit distribution and member buyout provisions. Is that something your team can handle?", time: "Jun 3, 11:00 am", type: "received" },
        { id: 2, from: "Office 102",  fromEmail: "info@office102llc.com",        body: "Hi Marcus,\n\nAbsolutely! Custom operating agreement clauses are included in our Premium LLC package. I'll have our legal team reach out to you within 1 business day to discuss your specific requirements.\n\nBest,\nOffice 102 Team", time: "Jun 3, 12:30 pm", type: "sent" },
      ],
    },
  ],
};

const TAG_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  Inquiry:   { backgroundColor: "#ede9fe", color: "#7c3aed" },
  Payment:   { backgroundColor: "#dcfce7", color: "#16a34a" },
  Question:  { backgroundColor: "#fef3c7", color: "#d97706" },
  Documents: { backgroundColor: "#dbeafe", color: "#2563eb" },
  Reminder:  { backgroundColor: "#fce7f3", color: "#db2777" },
  Request:   { backgroundColor: "#fff7ed", color: "#ea580c" },
  Update:    { backgroundColor: "#f0fdf4", color: "#15803d" },
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

/* ─── Main page ─────────────────────────────────────── */
export function EmailsPage() {
  const [activeWebsite, setActiveWebsite] = useState<Website>("IntelTrademark");
  const [threads, setThreads]             = useState<Record<Website, Thread[]>>(SEED);
  const [selected, setSelected]           = useState<Thread | null>(null);
  const [reply, setReply]                 = useState("");
  const [search, setSearch]               = useState("");
  const [connected, setConnected]         = useState<Partial<Record<Website, string>>>({
    IntelTrademark: "info@inteltrademark.com",
  });
  const [sending, setSending]             = useState(false);
  const [showCompose, setShowCompose]     = useState(false);
  const [composeTo, setComposeTo]         = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody]     = useState("");
  const msgEndRef = useRef<HTMLDivElement>(null);
  const nextMsgId = useRef(100);

  useEffect(() => { setSelected(null); setReply(""); }, [activeWebsite]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selected?.messages.length]);

  const meta        = WEBSITE_META[activeWebsite];
  const isConnected = !!connected[activeWebsite];

  const filteredThreads = threads[activeWebsite].filter(t =>
    search === "" ||
    t.leadName.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleSendReply = () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    setTimeout(() => {
      const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
      const newMsg: EmailMsg = { id: nextMsgId.current++, from: meta.label, fromEmail: connected[activeWebsite] ?? meta.email, body: reply.trim(), time: now, type: "sent" };
      setThreads(prev => {
        const updated = prev[activeWebsite].map(t => t.id === selected.id ? { ...t, messages: [...t.messages, newMsg], unread: false, lastTime: "Just now", preview: reply.trim().slice(0, 80) } : t);
        return { ...prev, [activeWebsite]: updated };
      });
      setSelected(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
      setReply(""); setSending(false);
    }, 600);
  };

  const handleComposeSend = () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;
    const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    const newThread: Thread = {
      id: nextMsgId.current++, leadName: composeTo.split("@")[0], leadEmail: composeTo.trim(),
      subject: composeSubject.trim(), unread: false, starred: false, lastTime: "Just now",
      preview: composeBody.trim().slice(0, 80),
      messages: [{ id: nextMsgId.current++, from: meta.label, fromEmail: connected[activeWebsite] ?? meta.email, body: composeBody.trim(), time: now, type: "sent" }],
    };
    setThreads(prev => ({ ...prev, [activeWebsite]: [newThread, ...prev[activeWebsite]] }));
    setShowCompose(false); setComposeTo(""); setComposeSubject(""); setComposeBody("");
    setSelected(newThread);
  };

  const toggleStar = (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => ({ ...prev, [activeWebsite]: prev[activeWebsite].map(t => t.id === threadId ? { ...t, starred: !t.starred } : t) }));
    if (selected?.id === threadId) setSelected(prev => prev ? { ...prev, starred: !prev.starred } : prev);
  };

  return (
    <div className="flex flex-col h-full gap-0 -m-7" style={{ margin: 0 }}>

      {/* ── Website tabs bar ── */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          {(Object.keys(WEBSITE_META) as Website[]).map(w => {
            const m = WEBSITE_META[w];
            const isActive = activeWebsite === w;
            const unread = threads[w].filter(t => t.unread).length;
            return (
              <button
                key={w}
                onClick={() => setActiveWebsite(w)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-slate-50 text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50 border border-transparent"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: m.color }}
                />
                {m.label}
                {unread > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-0.5"
                    style={{ backgroundColor: m.color }}
                  >
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-sm shadow-slate-200"
            style={{ backgroundColor: NAVY }}
          >
            <Plus size={14} strokeWidth={2.5} /> Compose
          </button>
        )}
      </div>

      {/* ── Main panel ── */}
      <div className="flex flex-1 overflow-hidden bg-slate-50/50">

        {!isConnected ? (
          /* Connect banner */
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/20">
            <div className="w-full max-w-sm text-center flex flex-col items-center gap-6 bg-white rounded-2xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 animate-scale-up">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: meta.bg }}>
                <Link2 size={28} style={{ color: meta.color }} />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-800">Connect Platform Email</p>
                <p className="text-xs mt-1.5 text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                  Connect <span className="font-bold text-slate-600">{meta.email}</span> to start managing emails and messages for {meta.label}.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3.5">
                <input
                  value={""}
                  readOnly
                  placeholder={meta.email}
                  className="w-full rounded-xl px-4 py-3 text-xs outline-none border border-slate-100 bg-slate-50 text-slate-400 font-bold select-none text-center"
                />
                <button
                  onClick={() => setConnected(p => ({ ...p, [activeWebsite]: meta.email }))}
                  className="w-full py-3.5 rounded-xl font-black text-white text-xs tracking-widest uppercase hover:opacity-95 active:scale-98 transition-all shadow-md cursor-pointer"
                  style={{ backgroundColor: meta.color }}
                >
                  Connect Address
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Left panel: thread list ── */}
            <div className="w-[320px] flex-shrink-0 flex flex-col bg-white border-r border-slate-100">

              {/* Panel Header */}
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800 font-extrabold text-sm tracking-tight">Sort by Date</span>
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer">
                    <ArrowUpDown size={12} className="text-slate-400" /> Sort
                  </button>
                </div>
                {/* Search Input */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/70 border border-slate-200/20 focus-within:border-slate-200 focus-within:bg-white transition-all">
                  <Search size={14} className="text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="text-xs outline-none bg-transparent flex-1 text-slate-800 placeholder-slate-400"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Thread list */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/40">
                {filteredThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">No emails found</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Try a different search term</p>
                    </div>
                  </div>
                ) : (
                  filteredThreads.map(t => {
                    const isActive = selected?.id === t.id;
                    const avatar = getAvatarStyle(t.leadName);
                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
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
                        }`}
                      >
                        {/* Left border strip for active thread */}
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ backgroundColor: meta.color }} />
                        )}
                        
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatar.bg}`}
                          >
                            {initials(t.leadName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`text-xs truncate ${t.unread ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
                                {t.leadName}
                              </span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {t.unread && (
                                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />
                                )}
                                <span className="text-[10px] text-slate-400 font-semibold">{t.lastTime}</span>
                                <button
                                  onClick={e => { e.stopPropagation(); toggleStar(t.id, e); }}
                                  className="text-slate-300 hover:text-amber-500 transition-colors"
                                >
                                  <Star
                                    size={12}
                                    fill={t.starred ? "#f59e0b" : "none"}
                                    style={{ color: t.starred ? "#f59e0b" : "currentColor" }}
                                  />
                                </button>
                              </div>
                            </div>
                            <p className={`text-xs truncate mb-1 ${t.unread ? "font-bold text-slate-800" : "font-medium text-slate-500"}`}>
                              {t.subject}
                            </p>
                            <p className="text-[11px] leading-relaxed text-slate-400 truncate">
                              {t.preview}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── Right panel: email detail ── */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {!selected ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-slate-50/10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                    <Mail size={24} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Select an email conversation</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Select an email thread from the list on the left to read messages, manage tags, and reply.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Email detail header bar */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 flex-shrink-0">
                        <Mail size={12} style={{ color: meta.color }} />
                      </div>
                      <span className="text-xs font-bold text-slate-400">Inbox</span>
                      <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate">
                        {selected.subject}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Open this email in your browser</span>
                      <button
                        onClick={() => setSelected(null)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Email content */}
                  <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50/20">

                    {/* From/To row */}
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarStyle(selected.leadName).bg}`}
                        >
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
                        {selected.tag && (
                          <span
                            className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
                            style={TAG_COLORS[selected.tag] ?? { backgroundColor: "#f3f4f6", color: "#6b7280" }}
                          >
                            {selected.tag}
                          </span>
                        )}
                        <button
                          onClick={e => toggleStar(selected.id, e)}
                          className="text-slate-300 hover:text-amber-500 transition-colors"
                        >
                          <Star
                            size={16}
                            fill={selected.starred ? "#f59e0b" : "none"}
                            style={{ color: selected.starred ? "#f59e0b" : "currentColor" }}
                          />
                        </button>
                        <span className="text-xs font-semibold text-slate-400">{selected.lastTime}</span>
                      </div>
                    </div>

                    {/* Big subject heading */}
                    <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">{selected.subject}</h2>

                    {/* Messages */}
                    <div className="flex flex-col gap-6">
                      {selected.messages.map((msg, idx) => {
                        const isSent = msg.type === "sent";
                        return (
                          <div key={msg.id} className="flex flex-col gap-3">
                            {idx > 0 && (
                              <div className="flex items-center gap-3 py-2">
                                <div className="flex-1 h-px bg-slate-100" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{msg.time}</span>
                                <div className="flex-1 h-px bg-slate-100" />
                              </div>
                            )}
                            
                            <div className="flex items-start gap-4">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  isSent ? "border" : getAvatarStyle(msg.from).bg
                                }`}
                                style={
                                  isSent
                                    ? { backgroundColor: meta.bg, color: meta.color, borderColor: `${meta.color}40` }
                                    : undefined
                                }
                              >
                                {initials(isSent ? meta.label : msg.from)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1.5">
                                  <span className="text-xs font-bold text-slate-800">{msg.from}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{msg.time}</span>
                                  {isSent && (
                                    <span
                                      className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                                      style={{ backgroundColor: meta.bg, color: meta.color }}
                                    >
                                      Sent
                                    </span>
                                  )}
                                </div>
                                <div
                                  className="rounded-xl px-5 py-4 text-sm leading-relaxed text-slate-600 border whitespace-pre-wrap shadow-sm"
                                  style={{
                                    backgroundColor: isSent ? meta.lightBg : "#ffffff",
                                    borderColor: isSent ? `${meta.color}15` : "#e2e8f080",
                                  }}
                                >
                                  {msg.body}
                                </div>
                                <p className="text-[10px] mt-1 ml-1 text-slate-400 font-semibold">{msg.fromEmail}</p>
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
                    <div className="flex items-center gap-2 mb-3">
                      <Reply size={14} style={{ color: meta.color }} />
                      <span className="text-xs font-black" style={{ color: meta.color }}>
                        Reply to {selected.leadName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">from {connected[activeWebsite]}</span>
                    </div>
                    
                    <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-slate-300 focus-within:shadow-sm transition-all bg-slate-50/20">
                      <textarea
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply(); }}
                        placeholder="Type your reply here... (Ctrl+Enter to send)"
                        rows={3}
                        className="w-full px-4 py-3 text-sm outline-none resize-none bg-transparent text-slate-800 placeholder-slate-400 border-none"
                      />
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-200/50">
                        <span className="text-[10px] text-slate-400 font-bold">Use markdown or plain text</span>
                        <button
                          onClick={handleSendReply}
                          disabled={!reply.trim() || sending}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs text-white transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0 cursor-pointer shadow-sm"
                          style={{ backgroundColor: meta.color }}
                        >
                          <Send size={12} />
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

      {/* ── Compose modal ── */}
      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setShowCompose(false); }}
        >
          <div className="w-full max-w-lg rounded-2xl shadow-2xl bg-white border border-slate-100 flex flex-col overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Mail size={12} style={{ color: meta.color }} />
                </div>
                <h2 className="text-sm font-black text-slate-800">Compose New Message</h2>
              </div>
              <button
                onClick={() => setShowCompose(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            {/* Form Body */}
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender Address (From)</label>
                <div className="px-4 py-2.5 rounded-lg text-sm bg-slate-50 border border-slate-200 text-slate-600 font-semibold select-none">
                  {connected[activeWebsite]}
                </div>
              </div>
              
              {[
                { label: "Recipient (To)", value: composeTo, onChange: setComposeTo, placeholder: "recipient@example.com" },
                { label: "Subject", value: composeSubject, onChange: setComposeSubject, placeholder: "Enter email subject" },
              ].map(f => (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</label>
                  <input
                    value={f.value}
                    onChange={e => f.onChange(e.target.value)}
                    placeholder={f.placeholder}
                    className="px-4 py-2.5 rounded-lg text-sm outline-none border border-slate-200 focus:border-slate-300 focus:bg-slate-50/10 text-slate-800 transition-all placeholder-slate-400"
                  />
                </div>
              ))}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Body</label>
                <textarea
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Write your message content..."
                  rows={5}
                  className="px-4 py-3 rounded-lg text-sm outline-none border border-slate-200 focus:border-slate-300 focus:bg-slate-50/10 text-slate-800 transition-all resize-none placeholder-slate-400"
                />
              </div>
              
              <button
                onClick={handleComposeSend}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white text-sm tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all shadow-md shadow-slate-100 cursor-pointer mt-2"
                style={{ backgroundColor: meta.color }}
              >
                <Send size={14} /> Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

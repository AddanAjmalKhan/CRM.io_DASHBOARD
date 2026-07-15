"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Mail, FileText, ChevronDown, ChevronUp } from "lucide-react";

const NAVY = "#161642";
const ACCENT = "#2f6bf2";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  created_at: string;
}

interface PdfTemplate {
  id: number;
  name: string;
  title: string;
  subtitle: string;
  footer_text: string;
  created_at: string;
}

function Field({ label, value, onChange, placeholder = "", type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: NAVY }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
        style={{ border: `1.5px solid ${focused ? ACCENT : "#e2e8f0"}`, boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : "none", color: NAVY }}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder = "", rows = 6 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: NAVY }}>{label}</label>
      <textarea
        value={value} placeholder={placeholder} rows={rows}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="rounded-lg px-3 py-2.5 text-sm outline-none transition-all resize-y"
        style={{ border: `1.5px solid ${focused ? ACCENT : "#e2e8f0"}`, boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : "none", color: NAVY, fontFamily: "monospace" }}
      />
      <p className="text-xs text-slate-400">Variables: {"{{firstName}}"} {"{{lastName}}"} {"{{businessName}}"} {"{{serialNumber}}"}</p>
    </div>
  );
}

// ─── Email Template Modal ─────────────────────────────────────────────────────
function EmailModal({ open, onClose, initial, onSave }: {
  open: boolean;
  onClose: () => void;
  initial?: EmailTemplate | null;
  onSave: () => void;
}) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSubject(initial?.subject ?? "");
      setBody(initial?.body ?? "");
      setError("");
    }
  }, [open, initial]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) { setError("All fields are required."); return; }
    setSaving(true); setError("");
    try {
      const method = initial ? "PATCH" : "POST";
      const payload: Record<string, unknown> = { name, subject, body };
      if (initial) payload.id = initial.id;
      const res = await fetch("/api/email-templates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      onSave();
      onClose();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.45)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-2xl shadow-2xl bg-white flex flex-col" style={{ border: "1px solid #e8edf5", maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-7 py-5 border-b" style={{ borderColor: "#f1f5f9" }}>
          <h2 className="text-base font-black" style={{ color: NAVY }}>{initial ? "Edit Email Template" : "Add Email Template"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={16} style={{ color: "#94a3b8" }} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-7 py-6 flex flex-col gap-4">
          <Field label="Template Name" value={name} onChange={setName} placeholder="e.g. Certificate Delivery" />
          <Field label="Email Subject" value={subject} onChange={setSubject} placeholder="e.g. Your Certificate — {{businessName}}" />
          <TextArea label="Email Body" value={body} onChange={setBody} rows={8}
            placeholder={"Dear {{firstName}} {{lastName}},\n\nPlease find your certificate attached.\n\nBest regards,\nBusiness Hub Team"} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-full font-black text-white tracking-widest uppercase text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: NAVY }}>
            {saving ? "SAVING..." : initial ? "UPDATE TEMPLATE" : "CREATE TEMPLATE"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Template Modal ───────────────────────────────────────────────────────
function PdfModal({ open, onClose, initial, onSave }: {
  open: boolean;
  onClose: () => void;
  initial?: PdfTemplate | null;
  onSave: () => void;
}) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [footerText, setFooterText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setTitle(initial?.title ?? "");
      setSubtitle(initial?.subtitle ?? "");
      setFooterText(initial?.footer_text ?? "");
      setError("");
    }
  }, [open, initial]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim() || !title.trim()) { setError("Name and title are required."); return; }
    setSaving(true); setError("");
    try {
      const method = initial ? "PATCH" : "POST";
      const payload: Record<string, unknown> = { name, title, subtitle, footer_text: footerText };
      if (initial) payload.id = initial.id;
      const res = await fetch("/api/pdf-templates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      onSave();
      onClose();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.45)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl rounded-2xl shadow-2xl bg-white flex flex-col" style={{ border: "1px solid #e8edf5", maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-7 py-5 border-b" style={{ borderColor: "#f1f5f9" }}>
          <h2 className="text-base font-black" style={{ color: NAVY }}>{initial ? "Edit PDF Template" : "Add PDF Template"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={16} style={{ color: "#94a3b8" }} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-7 py-6 flex flex-col gap-4">
          <Field label="Template Name" value={name} onChange={setName} placeholder="e.g. Standard Certificate" />
          <Field label="Certificate Title" value={title} onChange={setTitle} placeholder="e.g. Certificate of Registration" />
          <Field label="Subtitle (optional)" value={subtitle} onChange={setSubtitle} placeholder="e.g. This certifies the business has been officially registered." />
          <Field label="Footer Text (optional)" value={footerText} onChange={setFooterText} placeholder="e.g. Business Hub — Protecting your business." />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-full font-black text-white tracking-widest uppercase text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: NAVY }}>
            {saving ? "SAVING..." : initial ? "UPDATE TEMPLATE" : "CREATE TEMPLATE"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ open, name, onClose, onConfirm, loading }: {
  open: boolean; name: string; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.45)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl bg-white p-8 flex flex-col gap-5" style={{ border: "1px solid #e8edf5" }}>
        <h2 className="text-base font-black" style={{ color: NAVY }}>Delete Template?</h2>
        <p className="text-sm text-slate-500">Are you sure you want to delete <span className="font-bold text-slate-700">"{name}"</span>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full font-bold text-sm border hover:bg-gray-50 transition-colors" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-full font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#ef4444" }}>
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Email template card ──────────────────────────────────────────────────────
function EmailCard({ tpl, onEdit, onDelete }: { tpl: EmailTemplate; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border p-5 bg-white flex flex-col gap-3 transition-shadow hover:shadow-sm" style={{ borderColor: "#e8edf5" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: NAVY }}>{tpl.name}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">Subject: {tpl.subject}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setExpanded(p => !p)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
            {expanded ? <ChevronUp size={13} style={{ color: "#94a3b8" }} /> : <ChevronDown size={13} style={{ color: "#94a3b8" }} />}
          </button>
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors">
            <Pencil size={13} style={{ color: ACCENT }} />
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
            <Trash2 size={13} style={{ color: "#ef4444" }} />
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="text-xs text-slate-600 whitespace-pre-wrap rounded-lg p-3 bg-slate-50 font-mono leading-relaxed" style={{ border: "1px solid #e2e8f0" }}>
          {tpl.body}
        </pre>
      )}
    </div>
  );
}

// ─── PDF template card ────────────────────────────────────────────────────────
function PdfCard({ tpl, onEdit, onDelete }: { tpl: PdfTemplate; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-xl border p-5 bg-white flex items-start justify-between gap-4 transition-shadow hover:shadow-sm" style={{ borderColor: "#e8edf5" }}>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: NAVY }}>{tpl.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">Title: {tpl.title}</p>
        {tpl.subtitle && <p className="text-xs text-slate-400 truncate mt-0.5">Subtitle: {tpl.subtitle}</p>}
        {tpl.footer_text && <p className="text-xs text-slate-400 truncate mt-0.5">Footer: {tpl.footer_text}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors">
          <Pencil size={13} style={{ color: ACCENT }} />
        </button>
        <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
          <Trash2 size={13} style={{ color: "#ef4444" }} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function TemplatesPage() {
  const [tab, setTab] = useState<"email" | "pdf">("email");

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [pdfTemplates, setPdfTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [emailModal, setEmailModal] = useState<{ open: boolean; item?: EmailTemplate | null }>({ open: false });
  const [pdfModal, setPdfModal] = useState<{ open: boolean; item?: PdfTemplate | null }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; name: string; onConfirm: () => Promise<void> }>({ open: false, name: "", onConfirm: async () => {} });
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [eRes, pRes] = await Promise.all([
      fetch("/api/email-templates"),
      fetch("/api/pdf-templates"),
    ]);
    const [eData, pData] = await Promise.all([eRes.json(), pRes.json()]);
    setEmailTemplates(eData.templates ?? []);
    setPdfTemplates(pData.templates ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDeleteEmail = (tpl: EmailTemplate) => {
    setDeleteModal({
      open: true,
      name: tpl.name,
      onConfirm: async () => {
        setDeleting(true);
        await fetch(`/api/email-templates?id=${tpl.id}`, { method: "DELETE" });
        await fetchAll();
        setDeleting(false);
        setDeleteModal(p => ({ ...p, open: false }));
      },
    });
  };

  const handleDeletePdf = (tpl: PdfTemplate) => {
    setDeleteModal({
      open: true,
      name: tpl.name,
      onConfirm: async () => {
        setDeleting(true);
        await fetch(`/api/pdf-templates?id=${tpl.id}`, { method: "DELETE" });
        await fetchAll();
        setDeleting(false);
        setDeleteModal(p => ({ ...p, open: false }));
      },
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-2xl font-black" style={{ color: NAVY }}>Templates</h1>
        <p className="text-sm text-slate-400 mt-1">Manage email and PDF certificate templates.</p>
      </div>

      {/* Tabs */}
      <div className="px-8 mb-6">
        <div className="inline-flex rounded-xl p-1 gap-1" style={{ backgroundColor: "#eef2f8" }}>
          {(["email", "pdf"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all"
              style={tab === t
                ? { backgroundColor: NAVY, color: "#ffffff" }
                : { backgroundColor: "transparent", color: "#64748b" }
              }>
              {t === "email" ? <Mail size={14} /> : <FileText size={14} />}
              {t === "email" ? "Email Templates" : "PDF Templates"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading...</div>
        ) : tab === "email" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{emailTemplates.length} template{emailTemplates.length !== 1 ? "s" : ""}</p>
              <button
                onClick={() => setEmailModal({ open: true, item: null })}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: NAVY }}>
                <Plus size={13} strokeWidth={3} />
                ADD TEMPLATE
              </button>
            </div>
            {emailTemplates.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-12 text-center" style={{ borderColor: "#e2e8f0" }}>
                <Mail size={28} style={{ color: "#cbd5e1", margin: "0 auto 10px" }} />
                <p className="text-sm font-semibold text-slate-400">No email templates yet</p>
                <p className="text-xs text-slate-300 mt-1">Create one to get started</p>
              </div>
            ) : (
              emailTemplates.map(tpl => (
                <EmailCard
                  key={tpl.id} tpl={tpl}
                  onEdit={() => setEmailModal({ open: true, item: tpl })}
                  onDelete={() => handleDeleteEmail(tpl)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{pdfTemplates.length} template{pdfTemplates.length !== 1 ? "s" : ""}</p>
              <button
                onClick={() => setPdfModal({ open: true, item: null })}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: NAVY }}>
                <Plus size={13} strokeWidth={3} />
                ADD TEMPLATE
              </button>
            </div>
            {pdfTemplates.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed p-12 text-center" style={{ borderColor: "#e2e8f0" }}>
                <FileText size={28} style={{ color: "#cbd5e1", margin: "0 auto 10px" }} />
                <p className="text-sm font-semibold text-slate-400">No PDF templates yet</p>
                <p className="text-xs text-slate-300 mt-1">Create one to get started</p>
              </div>
            ) : (
              pdfTemplates.map(tpl => (
                <PdfCard
                  key={tpl.id} tpl={tpl}
                  onEdit={() => setPdfModal({ open: true, item: tpl })}
                  onDelete={() => handleDeletePdf(tpl)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <EmailModal open={emailModal.open} initial={emailModal.item} onClose={() => setEmailModal({ open: false })} onSave={fetchAll} />
      <PdfModal open={pdfModal.open} initial={pdfModal.item} onClose={() => setPdfModal({ open: false })} onSave={fetchAll} />
      <DeleteModal
        open={deleteModal.open} name={deleteModal.name} loading={deleting}
        onClose={() => setDeleteModal(p => ({ ...p, open: false }))}
        onConfirm={deleteModal.onConfirm}
      />
    </div>
  );
}

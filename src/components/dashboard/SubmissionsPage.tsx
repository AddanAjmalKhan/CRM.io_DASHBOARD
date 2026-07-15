"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, CheckCircle, AlertCircle, User, Mail, FileText, Hash, Building2, AtSign } from "lucide-react";
import Link from "next/link";

const NAVY  = "#161642";
const ACCENT = "#2f6bf2";

interface EmailTemplate { id: number; name: string; subject: string; }
interface PdfTemplate   { id: number; name: string; title: string; }

function InputField({ label, value, onChange, placeholder = "", type = "text", icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon: React.ElementType;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>{label}</label>
      <div className="relative">
        <Icon
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: focused ? ACCENT : "#94a3b8" }}
        />
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all"
          style={{
            border: `1.5px solid ${focused ? ACCENT : "#e2e8f0"}`,
            boxShadow: focused ? `0 0 0 3px ${ACCENT}1a` : "none",
            color: NAVY, backgroundColor: "#fff",
          }}
        />
      </div>
    </div>
  );
}

export function SubmissionsPage() {
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [businessName, setBusinessName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [email,        setEmail]        = useState("");
  const [emailTemplateId,  setEmailTemplateId]  = useState<number | "">("");
  const [pdfTemplateIds,   setPdfTemplateIds]   = useState<number[]>([]);

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [pdfTemplates,   setPdfTemplates]   = useState<PdfTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    const [eRes, pRes] = await Promise.all([fetch("/api/email-templates"), fetch("/api/pdf-templates")]);
    const [eData, pData] = await Promise.all([eRes.json(), pRes.json()]);
    const eTpls: EmailTemplate[] = eData.templates ?? [];
    const pTpls: PdfTemplate[]   = pData.templates ?? [];
    setEmailTemplates(eTpls);
    setPdfTemplates(pTpls);
    if (eTpls.length > 0) setEmailTemplateId(eTpls[0].id);
    if (pTpls.length > 0) setPdfTemplateIds([pTpls[0].id]);
    setLoadingTemplates(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const togglePdf = (id: number) =>
    setPdfTemplateIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const reset = () => {
    setFirstName(""); setLastName(""); setBusinessName(""); setSerialNumber(""); setEmail("");
    if (emailTemplates.length > 0) setEmailTemplateId(emailTemplates[0].id);
    if (pdfTemplates.length > 0) setPdfTemplateIds([pdfTemplates[0].id]);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !businessName.trim() || !serialNumber.trim() || !email.trim()) {
      setResult({ ok: false, message: "Please fill in all client fields." }); return;
    }
    if (!emailTemplateId) { setResult({ ok: false, message: "Please select an email template." }); return; }
    if (!pdfTemplateIds.length) { setResult({ ok: false, message: "Select at least one PDF to attach." }); return; }

    setSubmitting(true); setResult(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), businessName: businessName.trim(), serialNumber: serialNumber.trim(), email: email.trim(), emailTemplateId, pdfTemplateIds }),
      });
      const data = await res.json();
      if (!res.ok) setResult({ ok: false, message: data.error ?? "Failed to send." });
      else { setResult({ ok: true, message: `Certificate sent to ${email.trim()}` }); reset(); }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: "#f1f5fb" }}>

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-8 pt-8 pb-8" style={{ backgroundColor: NAVY }}>
        {/* Decorative circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: ACCENT }} />
        <div className="absolute right-48 -bottom-20 w-48 h-48 rounded-full opacity-5" style={{ backgroundColor: "#ffffff" }} />

        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${ACCENT}30` }}>
                <Send size={14} style={{ color: ACCENT }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: `${ACCENT}cc` }}>Certificate Dispatch</span>
            </div>
            <h1 className="text-3xl font-black text-white">New Submission</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Generate a Business Hub certificate and email it to your client.
            </p>
          </div>

          {/* Stats chips */}
          {!loadingTemplates && (
            <div className="flex gap-3 mt-1">
              <div className="rounded-xl px-4 py-2 text-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-lg font-black text-white">{emailTemplates.length}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Email Tpls</p>
              </div>
              <div className="rounded-xl px-4 py-2 text-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-lg font-black text-white">{pdfTemplates.length}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>PDF Tpls</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-5 gap-6 items-start">

          {/* ── Left: Client Info (3/5) ─────────────────────────── */}
          <div className="col-span-3 flex flex-col gap-5">

            {/* Step header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ backgroundColor: ACCENT }}>1</div>
              <div>
                <p className="text-sm font-black" style={{ color: NAVY }}>Client Information</p>
                <p className="text-xs text-slate-400">Enter the details that will appear on the certificate</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 flex flex-col gap-4 shadow-sm" style={{ border: "1px solid #e8edf5" }}>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="First Name"  value={firstName}  onChange={setFirstName}  placeholder="John"          icon={User} />
                <InputField label="Last Name"   value={lastName}   onChange={setLastName}   placeholder="Doe"           icon={User} />
              </div>
              <InputField label="Business Name"  value={businessName} onChange={setBusinessName} placeholder="Acme Corp" icon={Building2} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Email Address" value={email}         onChange={setEmail}         type="email" placeholder="client@example.com" icon={AtSign} />
                <InputField label="Serial Number" value={serialNumber}  onChange={setSerialNumber}  placeholder="BH-2026-0001" icon={Hash} />
              </div>
            </div>

            {/* Step 2 header */}
            <div className="flex items-center gap-3 mt-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ backgroundColor: ACCENT }}>2</div>
              <div>
                <p className="text-sm font-black" style={{ color: NAVY }}>Choose Templates</p>
                <p className="text-xs text-slate-400">Select the email to send and which PDFs to attach</p>
              </div>
            </div>

            {loadingTemplates ? (
              <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm" style={{ border: "1px solid #e8edf5" }}>
                Loading templates…
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-6 flex flex-col gap-6 shadow-sm" style={{ border: "1px solid #e8edf5" }}>

                {/* Email template */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Mail size={14} style={{ color: ACCENT }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Template</span>
                  </div>

                  {emailTemplates.length === 0 ? (
                    <div className="rounded-xl p-4 text-sm text-slate-400 text-center" style={{ border: "1.5px dashed #e2e8f0" }}>
                      No email templates.{" "}
                      <Link href="/dashboard/templates" className="font-semibold" style={{ color: ACCENT }}>Create one →</Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {emailTemplates.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setEmailTemplateId(t.id)}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                          style={{
                            border: `1.5px solid ${emailTemplateId === t.id ? ACCENT : "#e2e8f0"}`,
                            backgroundColor: emailTemplateId === t.id ? `${ACCENT}08` : "#fafafa",
                          }}>
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border-2"
                            style={{ borderColor: emailTemplateId === t.id ? ACCENT : "#cbd5e1" }}>
                            {emailTemplateId === t.id && (
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: NAVY }}>{t.name}</p>
                            <p className="text-xs text-slate-400 truncate">{t.subject}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* PDF templates */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <FileText size={14} style={{ color: ACCENT }} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">PDF Attachments</span>
                  </div>

                  {pdfTemplates.length === 0 ? (
                    <div className="rounded-xl p-4 text-sm text-slate-400 text-center" style={{ border: "1.5px dashed #e2e8f0" }}>
                      No PDF templates.{" "}
                      <Link href="/dashboard/templates" className="font-semibold" style={{ color: ACCENT }}>Create one →</Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {pdfTemplates.map(t => {
                        const checked = pdfTemplateIds.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            onClick={() => togglePdf(t.id)}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                            style={{
                              border: `1.5px solid ${checked ? ACCENT : "#e2e8f0"}`,
                              backgroundColor: checked ? `${ACCENT}08` : "#fafafa",
                            }}>
                            <div
                              className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all"
                              style={{ borderColor: checked ? ACCENT : "#cbd5e1", backgroundColor: checked ? ACCENT : "transparent" }}>
                              {checked && (
                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: NAVY }}>{t.name}</p>
                              <p className="text-xs text-slate-400 truncate">{t.title}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Summary + Send (2/5) ─────────────────────── */}
          <div className="col-span-2 flex flex-col gap-4 sticky top-6">

            {/* Summary card */}
            <div className="rounded-2xl bg-white p-6 flex flex-col gap-4 shadow-sm" style={{ border: "1px solid #e8edf5" }}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Summary</p>

              <div className="flex flex-col gap-3">
                <Row label="Name"   value={firstName || lastName ? `${firstName} ${lastName}`.trim() : "—"} />
                <Row label="Business" value={businessName || "—"} />
                <Row label="Email"    value={email || "—"} />
                <Row label="Serial"   value={serialNumber || "—"} />
              </div>

              <div className="border-t pt-4 flex flex-col gap-2" style={{ borderColor: "#f1f5f9" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Attachments</p>
                {pdfTemplateIds.length === 0 ? (
                  <p className="text-xs text-slate-300 italic">No PDFs selected</p>
                ) : (
                  pdfTemplates
                    .filter(t => pdfTemplateIds.includes(t.id))
                    .map(t => (
                      <div key={t.id} className="flex items-center gap-2">
                        <FileText size={12} style={{ color: ACCENT }} />
                        <span className="text-xs font-semibold" style={{ color: NAVY }}>{t.name}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Result */}
            {result && (
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  backgroundColor: result.ok ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${result.ok ? "#bbf7d0" : "#fecaca"}`,
                }}>
                {result.ok
                  ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#10b981" }} />
                  : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                }
                <p className="text-xs font-semibold leading-relaxed" style={{ color: result.ok ? "#065f46" : "#991b1b" }}>
                  {result.message}
                </p>
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || loadingTemplates}
              className="w-full py-4 rounded-2xl font-black text-white tracking-widest uppercase text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-3 shadow-lg"
              style={{
                background: submitting ? NAVY : `linear-gradient(135deg, ${NAVY} 0%, #1e2a6e 100%)`,
                boxShadow: `0 8px 24px ${NAVY}30`,
              }}>
              <Send size={15} />
              {submitting ? "SENDING…" : "SEND CERTIFICATE"}
            </button>

            <p className="text-center text-xs text-slate-400">
              PDFs are generated instantly and attached to the email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-right truncate max-w-[160px]" style={{ color: NAVY }}>{value}</span>
    </div>
  );
}

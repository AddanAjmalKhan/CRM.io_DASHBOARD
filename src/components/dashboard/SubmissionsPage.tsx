"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

const NAVY = "#161642";
const ACCENT = "#2f6bf2";

interface EmailTemplate { id: number; name: string; subject: string; }
interface PdfTemplate { id: number; name: string; title: string; }

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
        style={{ border: `1.5px solid ${focused ? ACCENT : "#e2e8f0"}`, boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : "none", color: NAVY, backgroundColor: "#fff" }}
      />
    </div>
  );
}

export function SubmissionsPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [email, setEmail] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState<number | "">("");
  const [pdfTemplateIds, setPdfTemplateIds] = useState<number[]>([]);

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [pdfTemplates, setPdfTemplates] = useState<PdfTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    const [eRes, pRes] = await Promise.all([
      fetch("/api/email-templates"),
      fetch("/api/pdf-templates"),
    ]);
    const [eData, pData] = await Promise.all([eRes.json(), pRes.json()]);
    const eTpls: EmailTemplate[] = eData.templates ?? [];
    const pTpls: PdfTemplate[] = pData.templates ?? [];
    setEmailTemplates(eTpls);
    setPdfTemplates(pTpls);
    if (eTpls.length > 0) setEmailTemplateId(eTpls[0].id);
    if (pTpls.length > 0) setPdfTemplateIds([pTpls[0].id]);
    setLoadingTemplates(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const togglePdf = (id: number) => {
    setPdfTemplateIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const reset = () => {
    setFirstName(""); setLastName(""); setBusinessName("");
    setSerialNumber(""); setEmail("");
    if (emailTemplates.length > 0) setEmailTemplateId(emailTemplates[0].id);
    if (pdfTemplates.length > 0) setPdfTemplateIds([pdfTemplates[0].id]);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !businessName.trim() || !serialNumber.trim() || !email.trim()) {
      setResult({ ok: false, message: "Please fill in all fields." });
      return;
    }
    if (!emailTemplateId) {
      setResult({ ok: false, message: "Please select an email template." });
      return;
    }
    if (pdfTemplateIds.length === 0) {
      setResult({ ok: false, message: "Please select at least one PDF template." });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          businessName: businessName.trim(),
          serialNumber: serialNumber.trim(),
          email: email.trim(),
          emailTemplateId,
          pdfTemplateIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? "Failed to send." });
      } else {
        setResult({ ok: true, message: `Certificate emailed to ${email.trim()} successfully!` });
        reset();
      }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-2xl font-black" style={{ color: NAVY }}>New Submission</h1>
        <p className="text-sm text-slate-400 mt-1">Generate and email a certificate to a client.</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        <div className="max-w-2xl flex flex-col gap-6">

          {/* Client info card */}
          <div className="rounded-2xl bg-white p-6 flex flex-col gap-5 shadow-sm" style={{ border: "1px solid #e8edf5" }}>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: NAVY }}>Client Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="John" />
              <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Business Name" value={businessName} onChange={setBusinessName} placeholder="Acme Corp" />
              <Field label="Email Address" value={email} onChange={setEmail} type="email" placeholder="client@example.com" />
            </div>
            <Field label="Serial Number" value={serialNumber} onChange={setSerialNumber} placeholder="e.g. BH-2026-0001" />
          </div>

          {/* Template selection card */}
          <div className="rounded-2xl bg-white p-6 flex flex-col gap-5 shadow-sm" style={{ border: "1px solid #e8edf5" }}>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: NAVY }}>Template Selection</h2>

            {loadingTemplates ? (
              <p className="text-sm text-slate-400">Loading templates...</p>
            ) : (
              <>
                {/* Email template */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" style={{ color: NAVY }}>Email Template</label>
                  {emailTemplates.length === 0 ? (
                    <p className="text-sm text-slate-400">No email templates found. <a href="/dashboard/templates" className="underline" style={{ color: ACCENT }}>Create one →</a></p>
                  ) : (
                    <select
                      value={emailTemplateId}
                      onChange={e => setEmailTemplateId(Number(e.target.value))}
                      className="rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer"
                      style={{ border: "1.5px solid #e2e8f0", color: NAVY, backgroundColor: "#fff" }}>
                      {emailTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* PDF templates */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" style={{ color: NAVY }}>PDF Attachments</label>
                  {pdfTemplates.length === 0 ? (
                    <p className="text-sm text-slate-400">No PDF templates found. <a href="/dashboard/templates" className="underline" style={{ color: ACCENT }}>Create one →</a></p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {pdfTemplates.map(t => (
                        <label key={t.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors hover:bg-slate-50"
                          style={{ border: `1.5px solid ${pdfTemplateIds.includes(t.id) ? ACCENT : "#e2e8f0"}`, backgroundColor: pdfTemplateIds.includes(t.id) ? `${ACCENT}08` : "transparent" }}>
                          <input
                            type="checkbox"
                            checked={pdfTemplateIds.includes(t.id)}
                            onChange={() => togglePdf(t.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                            style={{ accentColor: ACCENT }}
                          />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: NAVY }}>{t.name}</p>
                            <p className="text-xs text-slate-400">{t.title}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Result message */}
          {result && (
            <div className={`rounded-xl p-4 flex items-start gap-3 ${result.ok ? "bg-emerald-50" : "bg-red-50"}`}
              style={{ border: `1px solid ${result.ok ? "#bbf7d0" : "#fecaca"}` }}>
              {result.ok
                ? <CheckCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: "#10b981" }} />
                : <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
              }
              <p className="text-sm font-semibold" style={{ color: result.ok ? "#065f46" : "#991b1b" }}>{result.message}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingTemplates}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-full font-black text-white tracking-widest uppercase text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: NAVY }}>
            <Send size={16} />
            {submitting ? "SENDING..." : "SEND CERTIFICATE EMAIL"}
          </button>
        </div>
      </div>
    </div>
  );
}

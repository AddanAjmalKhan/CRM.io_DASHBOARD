"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, ExternalLink } from "lucide-react";
import { CURRENCY_SYM } from "./AddInvoiceModal";
import type { Invoice } from "./InvoicesTable";

const NAVY  = "#161642";
const ACCENT = "#2f6bf2";

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
      style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}>
      <span className="flex-1 text-sm font-mono truncate" style={{ color: NAVY }}>{value}</span>
      <button onClick={copy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        style={{ backgroundColor: copied ? "#dcfce7" : `${ACCENT}18`, color: copied ? "#16a34a" : ACCENT }}>
        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
      </button>
    </div>
  );
}

export function InvoicePreviewModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!invoice) return null;

  const sym    = CURRENCY_SYM[invoice.currency] ?? "$";
  const link   = `https://pay.businesshub.com/inv/${invoice.invoiceNumber}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl bg-white flex flex-col"
        style={{ border: "1px solid #e8edf5", maxHeight: "90vh" }}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-7 py-5 border-b flex-shrink-0"
          style={{ borderColor: "#f1f5f9" }}>
          <div>
            <h2 className="text-base font-black" style={{ color: NAVY }}>Invoice Generated!</h2>
            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Share the link or save the preview below.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={16} style={{ color: "#94a3b8" }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-7 py-5 flex flex-col gap-5">

          {/* Generated link */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Invoice Link</label>
            <CopyField value={link} />
            <a href="#" className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:underline w-fit"
              style={{ color: ACCENT }}>
              <ExternalLink size={12} /> Open Invoice Page
            </a>
          </div>

          {/* Invoice preview card */}
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#e2e8f0" }}>

            {/* Invoice header */}
            <div className="px-8 pt-7 pb-5" style={{ backgroundColor: NAVY }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: ACCENT, boxShadow: `0 0 16px ${ACCENT}60` }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M10.5 2L4 10H9L7.5 16L14 8H9L10.5 2Z" fill="black" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm tracking-widest uppercase">Business Hub</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>businesshub.com</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white tracking-wider">INVOICE</p>
                  <p className="text-xs font-mono mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                    #{invoice.invoiceNumber}
                  </p>
                </div>
              </div>

              {/* Invoice meta */}
              <div className="flex gap-6 mt-5">
                {[
                  { label: "Date",       value: invoice.date },
                  { label: "Due Date",   value: invoice.dueDate },
                  { label: "Status",     value: invoice.status },
                  { label: "Payment",    value: invoice.paymentType },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                    <p className="text-sm font-bold mt-0.5"
                      style={{ color: label === "Status" && value === "Pending" ? ACCENT : "white" }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill To */}
            <div className="px-8 py-5 border-b" style={{ borderColor: "#f1f5f9" }}>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "#9ca3af" }}>Bill To</p>
              <p className="text-sm font-bold" style={{ color: NAVY }}>{invoice.custName}</p>
              {invoice.custEmail && <p className="text-sm" style={{ color: "#6b7280" }}>{invoice.custEmail}</p>}
              {invoice.custPhone && <p className="text-sm" style={{ color: "#6b7280" }}>{invoice.custPhone}</p>}
            </div>

            {/* Services */}
            <div className="px-8 py-5">
              <div className="flex justify-between pb-2 border-b" style={{ borderColor: "#f1f5f9" }}>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#9ca3af" }}>Service</span>
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#9ca3af" }}>Amount</span>
              </div>
              {invoice.services.map((svc, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b"
                  style={{ borderColor: "#f9fafb" }}>
                  <span className="text-sm" style={{ color: "#374151" }}>{svc.name}</span>
                  <span className="text-sm font-semibold" style={{ color: NAVY }}>
                    {sym}{svc.price.toFixed(2)}
                  </span>
                </div>
              ))}

              {/* Total */}
              <div className="flex justify-between items-center pt-4 mt-1">
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>Total</span>
                <span className="text-xl font-black" style={{ color: NAVY }}>
                  {sym}{invoice.amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Done button */}
          <button onClick={onClose}
            className="w-full py-3 rounded-full font-bold text-white text-sm tracking-widest uppercase transition-opacity hover:opacity-90"
            style={{ backgroundColor: NAVY }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

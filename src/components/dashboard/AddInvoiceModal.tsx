"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2 } from "lucide-react";

const NAVY  = "#161642";
const ACCENT = "#2f6bf2";

export const PAYMENT_TYPES = ["KurvPay"];
export const CURRENCIES    = ["Dollar", "Euro", "British Pound", "Canadian Dollar"];
export const INVOICE_SOURCES = ["IntelTrademark", "Office101", "Office102"];
export const CURRENCY_SYM: Record<string, string> = {
  "Dollar": "$", "Euro": "€", "British Pound": "£", "Canadian Dollar": "CA$",
};

interface ServiceRow { id: number; name: string; price: string; }

export interface InvoiceFormData {
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  source: string;
  paymentType: string;
  currency: string;
  dueDate: string;
  salesBy: string;
  services: { name: string; price: number }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onGenerate: (data: InvoiceFormData) => void;
  initialData?: InvoiceFormData;
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: NAVY }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
        style={{
          border: `1.5px solid ${focused ? ACCENT : "#e2e8f0"}`,
          boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : "none",
          color: NAVY, backgroundColor: "#fff",
        }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: NAVY }}>{label}</label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="rounded-lg px-3 py-2.5 text-sm outline-none transition-all cursor-pointer"
        style={{
          border: `1.5px solid ${focused ? ACCENT : "#e2e8f0"}`,
          boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : "none",
          color: NAVY, backgroundColor: "#fff",
        }}
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function AddInvoiceModal({ open, onClose, onGenerate, initialData }: Props) {
  const isEdit = !!initialData;

  const [clientEmail, setClientEmail] = useState("");
  const [clientName,  setClientName]  = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [source,      setSource]      = useState("IntelTrademark");
  const [paymentType, setPaymentType] = useState("KurvPay");
  const [currency,    setCurrency]    = useState("Dollar");
  const [dueDate,     setDueDate]     = useState("");
  const [salesBy,     setSalesBy]     = useState("");
  const [services,    setServices]    = useState<ServiceRow[]>([{ id: 1, name: "", price: "" }]);
  const svcId = useRef(2);

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setClientEmail(initialData.clientEmail);
      setClientName(initialData.clientName);
      setClientPhone(initialData.clientPhone);
      setSource(initialData.source);
      setPaymentType(initialData.paymentType);
      setCurrency(initialData.currency);
      setDueDate(initialData.dueDate);
      setSalesBy(initialData.salesBy ?? "");
      setServices(initialData.services.map((s, i) => ({ id: i + 1, name: s.name, price: String(s.price) })));
      svcId.current = initialData.services.length + 1;
    } else {
      setClientEmail(""); setClientName(""); setClientPhone("");
      setSource("IntelTrademark");
      setPaymentType("KurvPay"); setCurrency("Dollar"); setDueDate(""); setSalesBy("");
      setServices([{ id: 1, name: "", price: "" }]); svcId.current = 2;
    }
  }, [open, initialData]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;

  const addService = () => setServices(p => [...p, { id: svcId.current++, name: "", price: "" }]);
  const removeService = (id: number) => { if (services.length > 1) setServices(p => p.filter(s => s.id !== id)); };
  const updateService = (id: number, field: "name" | "price", val: string) =>
    setServices(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));

  const total = services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);

  const handleGenerate = () => {
    if (!clientName.trim()) return;
    const valid = services.filter(s => s.name.trim() && s.price);
    if (valid.length === 0) return;
    onGenerate({
      clientEmail: clientEmail.trim(), clientName: clientName.trim(), clientPhone: clientPhone.trim(),
      source, paymentType, currency, dueDate, salesBy: salesBy.trim(),
      services: valid.map(s => ({ name: s.name.trim(), price: parseFloat(s.price) || 0 })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-3xl rounded-2xl shadow-2xl bg-white flex flex-col"
        style={{ border: "1px solid #e8edf5", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b flex-shrink-0"
          style={{ borderColor: "#f1f5f9" }}>
          <h2 className="text-lg font-black" style={{ color: NAVY }}>
            {isEdit ? "Edit Invoice" : "Add Invoice"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={16} style={{ color: "#94a3b8" }} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-8 py-6 flex flex-col gap-5">

          {/* Row 1: Client info */}
          <div className="grid grid-cols-3 gap-5">
            <Field label="Client Name"  value={clientName}  onChange={setClientName}  placeholder="Full name" />
            <Field label="Client Email" value={clientEmail} onChange={setClientEmail} type="email" placeholder="client@example.com" />
            <Field label="Client Phone" value={clientPhone} onChange={setClientPhone} type="tel" placeholder="+1 000 000 0000" />
          </div>

          {/* Row 2: Source, Payment, Currency, Due Date */}
          <div className="grid grid-cols-4 gap-5">
            <SelectField label="Source"       value={source}      onChange={setSource}      options={INVOICE_SOURCES} />
            <SelectField label="Payment Type" value={paymentType} onChange={setPaymentType} options={PAYMENT_TYPES} />
            <SelectField label="Currency"     value={currency}    onChange={setCurrency}    options={CURRENCIES} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: NAVY }}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f0", color: NAVY, backgroundColor: "#fff" }} />
            </div>
          </div>

          {/* Row 3: Sales By */}
          <div className="grid grid-cols-3 gap-5">
            <Field label="Sales By" value={salesBy} onChange={setSalesBy} placeholder="Agent name" />
          </div>

          {/* Services */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold" style={{ color: NAVY }}>Services</label>
              <button onClick={addService}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: NAVY }}>
                <Plus size={12} strokeWidth={3} />
                ADD SERVICE
              </button>
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 160px 40px" }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Service Name</span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Price ({CURRENCY_SYM[currency]})</span>
              <span />
            </div>

            {services.map((svc) => (
              <div key={svc.id} className="grid gap-3 items-center" style={{ gridTemplateColumns: "1fr 160px 40px" }}>
                <input
                  value={svc.name} placeholder="Service description"
                  onChange={(e) => updateService(svc.id, "name", e.target.value)}
                  className="rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid #e2e8f0", color: NAVY }}
                />
                <input
                  value={svc.price} placeholder="0.00" type="number" min="0" step="0.01"
                  onChange={(e) => updateService(svc.id, "price", e.target.value)}
                  className="rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ border: "1.5px solid #e2e8f0", color: NAVY }}
                />
                <button onClick={() => removeService(svc.id)}
                  disabled={services.length === 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 disabled:opacity-30">
                  <Trash2 size={14} style={{ color: "#ef4444" }} />
                </button>
              </div>
            ))}

            {total > 0 && (
              <div className="flex justify-end pt-1">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <span className="text-sm" style={{ color: "#6b7280" }}>Total:</span>
                  <span className="text-base font-black" style={{ color: NAVY }}>
                    {CURRENCY_SYM[currency]}{total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Generate button */}
          <div className="pt-1">
            <button onClick={handleGenerate}
              className="w-full py-3.5 rounded-full font-black text-white tracking-widest uppercase text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: NAVY }}>
              {isEdit ? "UPDATE INVOICE" : "GENERATE INVOICE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

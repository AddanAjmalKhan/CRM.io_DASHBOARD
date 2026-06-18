"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const NAVY   = "#161642";
const ACCENT = "#EAB308";

const SOURCES = ["Office101", "Office102", "IntelTrademark"];
const ROLES   = ["Client", "Manager", "Volunteer"];

export interface LeadForm {
  name: string;
  email: string;
  phone: string;
  source: string;
  role: string;
  country: string;
  ip_address: string;
  ip_city: string;
  ip_state: string;
  ip_country: string;
}

const EMPTY: LeadForm = {
  name: "", email: "", phone: "",
  source: "Office101", role: "Client", country: "",
  ip_address: "", ip_city: "", ip_state: "", ip_country: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (lead: LeadForm) => void;
  initialData?: LeadForm;
  onSave?: (lead: LeadForm) => void;
  saving?: boolean;
  apiError?: string;
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
        onChange={e => onChange(e.target.value)}
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
        value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all appearance-none cursor-pointer"
        style={{
          border: `1.5px solid ${focused ? ACCENT : "#e2e8f0"}`,
          boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : "none",
          color: NAVY, backgroundColor: "#fff",
          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
          backgroundSize: '8px 8px', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat',
          paddingRight: '2rem',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function AddLeadModal({ open, onClose, onAdd, initialData, onSave, saving, apiError }: Props) {
  const isEdit = !!initialData;
  const [form, setForm] = useState<LeadForm>(initialData ?? EMPTY);

  useEffect(() => {
    if (open) setForm(initialData ?? EMPTY);
  }, [open, initialData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  const set = (key: keyof LeadForm) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (isEdit && onSave) {
      onSave(form);
    } else {
      onAdd(form);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.45)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-3xl rounded-2xl shadow-2xl bg-white"
        style={{ border: "1px solid #e8edf5", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b sticky top-0 bg-white z-10"
          style={{ borderColor: "#f1f5f9" }}>
          <h2 className="text-lg font-black" style={{ color: NAVY }}>
            {isEdit ? "Edit Lead" : "Add a Lead"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X size={16} style={{ color: "#94a3b8" }} />
          </button>
        </div>

        {/* Form */}
        <div className="px-8 py-6 flex flex-col gap-5">
          {apiError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{apiError}</p>
          )}

          {/* Row 1: Name, Email, Phone */}
          <div className="grid grid-cols-3 gap-5">
            <Field label="Name"  value={form.name}  onChange={set("name")}  placeholder="Full name" />
            <Field label="Email" value={form.email} onChange={set("email")} type="email" placeholder="email@example.com" />
            <Field label="Phone" value={form.phone} onChange={set("phone")} type="tel" placeholder="+1 000 000 0000" />
          </div>

          {/* Row 2: Source, Role, Country */}
          <div className="grid grid-cols-3 gap-5">
            <SelectField label="Source"  value={form.source}  onChange={set("source")}  options={SOURCES} />
            <SelectField label="Type"    value={form.role}    onChange={set("role")}    options={ROLES} />
            <Field       label="Country" value={form.country} onChange={set("country")} placeholder="United States" />
          </div>

          {/* Row 3: IP fields */}
          <div className="grid grid-cols-4 gap-5">
            <Field label="IP Address" value={form.ip_address} onChange={set("ip_address")} placeholder="0.0.0.0" />
            <Field label="IP City"    value={form.ip_city}    onChange={set("ip_city")}    placeholder="City" />
            <Field label="IP State"   value={form.ip_state}   onChange={set("ip_state")}   placeholder="State" />
            <Field label="IP Country" value={form.ip_country} onChange={set("ip_country")} placeholder="US" />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleSubmit} disabled={saving}
              className="px-7 py-2.5 rounded-full text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              style={{ backgroundColor: NAVY, color: "#fff" }}>
              {saving ? "Saving…" : isEdit ? "Update" : "Add Lead"}
            </button>
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-colors hover:bg-gray-100"
              style={{ color: "#94a3b8" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

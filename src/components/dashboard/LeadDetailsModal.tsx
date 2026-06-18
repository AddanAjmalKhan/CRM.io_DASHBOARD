"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

const NAVY = "#161642";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  role?: string;
  country?: string;
  ip_address?: string;
  ip_city?: string;
  ip_state?: string;
  ip_country?: string;
  created_at?: string;
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-4 py-1.5">
      <span className="w-36 flex-shrink-0 text-sm font-semibold" style={{ color: NAVY }}>{label}:</span>
      <span className="text-sm" style={{ color: "#374151" }}>{value || "—"}</span>
    </div>
  );
}

export function LeadDetailsModal({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!lead) return null;

  const createdStr = lead.created_at
    ? new Date(lead.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.5)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid #e8edf5" }}>

        <div className="relative flex items-center justify-center px-8 py-5" style={{ backgroundColor: NAVY }}>
          <h2 className="text-base font-black tracking-widest uppercase text-white">Lead Details</h2>
          <button onClick={onClose}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <X size={15} color="white" />
          </button>
        </div>

        <div className="bg-white px-10 py-8">
          <Row label="Name"       value={lead.name} />
          <Row label="Email"      value={lead.email} />
          <Row label="Phone"      value={lead.phone} />
          <Row label="Source"     value={lead.source} />
          <Row label="Type"       value={lead.role} />
          <Row label="Country"    value={lead.country} />
          <Row label="IP Address" value={lead.ip_address} />
          <Row label="IP City"    value={lead.ip_city} />
          <Row label="IP State"   value={lead.ip_state} />
          <Row label="IP Country" value={lead.ip_country} />
          <Row label="Created At" value={createdStr} />
          <div className="mt-6 h-px" style={{ backgroundColor: "#e5e7eb" }} />
        </div>
      </div>
    </div>
  );
}

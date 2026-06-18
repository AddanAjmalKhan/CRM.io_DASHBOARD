"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Search as SearchIcon, Printer, SlidersHorizontal, Eye } from "lucide-react";
import { AddInvoiceModal, InvoiceFormData, CURRENCY_SYM } from "./AddInvoiceModal";
import { InvoicePreviewModal } from "./InvoicePreviewModal";

const NAVY  = "#2f6bf2";
const ACCENT = "#2f6bf2";

export interface Invoice {
  id: number;
  invoiceNumber: string;
  custName: string;
  custEmail: string;
  custPhone: string;
  source: string;
  currency: string;
  amount: number;
  date: string;
  dueDate: string;
  paymentType: string;
  status: "Pending" | "Paid";
  paymentVoidDate?: string;
  salesBy: string;
  services: { name: string; price: number }[];
}

function fmt(d: string) {
  /* "2026-06-17" → "Jun, 17 2026" */
  if (!d) return "—";
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).replace(",", ",");
}

const SEED: Invoice[] = [
  {
    id: 1, invoiceNumber: "TO-AN-2606-16091", custName: "Test",                    custEmail: "Test@info.com",                    custPhone: "",              source: "IntelTrademark", currency: "Dollar", amount: 499,  date: "Jun, 05 2026", dueDate: "Jun, 17 2026", paymentType: "TailoredPay", status: "Pending", salesBy: "Saad Sattar",
    services: [{ name: "Trademark Filing", price: 499 }],
  },
  {
    id: 2, invoiceNumber: "TO-AN-2602-16102", custName: "Bashir Muhammad",          custEmail: "finance@zynteck.com",              custPhone: "",              source: "Office101",      currency: "Dollar", amount: 12,   date: "Feb, 17 2026", dueDate: "Feb, 18 2026", paymentType: "Stripe",      status: "Pending", salesBy: "Fariz",
    services: [{ name: "Processing Fee", price: 12 }],
  },
  {
    id: 3, invoiceNumber: "TO-AN-2601-16137", custName: "Tiffany McKitrick",        custEmail: "Tmckitrick1101@gmail.com",         custPhone: "",              source: "Office102",      currency: "Dollar", amount: 350,  date: "Jan, 27 2026", dueDate: "Jan, 26 2026", paymentType: "Nexio-AUTH",  status: "Pending", salesBy: "Shahwaiz",
    services: [{ name: "Trademark Registration", price: 350 }],
  },
  {
    id: 4, invoiceNumber: "TO-AN-2512-16136", custName: "Robert & Sandra Olson",    custEmail: "lockandloadboutique@gmail.com",    custPhone: "",              source: "IntelTrademark", currency: "Dollar", amount: 750,  date: "Dec, 23 2025", dueDate: "Dec, 22 2025", paymentType: "Nexio-AUTH",  status: "Pending", salesBy: "Fariz",
    services: [{ name: "Full Trademark Package", price: 750 }],
  },
  {
    id: 5, invoiceNumber: "TO-AN-2512-16126", custName: "Bashir Muhammad",          custEmail: "finance@zynteck.com",              custPhone: "",              source: "Office101",      currency: "Dollar", amount: 4,    date: "Dec, 13 2025", dueDate: "Dec, 13 2025", paymentType: "PayArc-AUTH", status: "Paid",    paymentVoidDate: "Dec, 13 2025 02:43 am", salesBy: "Fariz",
    services: [{ name: "Convenience Fee", price: 4 }],
  },
  {
    id: 6, invoiceNumber: "TO-AN-2512-16135", custName: "(512) 299-3572",           custEmail: "beyondPompeiipizza@gmail.com",     custPhone: "(512) 299-3572", source: "Office102",      currency: "Dollar", amount: 1500, date: "Dec, 05 2025", dueDate: "Dec, 04 2025", paymentType: "Nexio-AUTH",  status: "Pending", salesBy: "Shoaib Ali",
    services: [{ name: "Premium Trademark Package", price: 1500 }],
  },
  {
    id: 7, invoiceNumber: "TO-AN-2512-16134", custName: "(512) 299-3572",           custEmail: "beyondPompeiipizza@gmail.com",     custPhone: "(512) 299-3572", source: "Office102",      currency: "Dollar", amount: 1500, date: "Dec, 05 2025", dueDate: "Dec, 04 2025", paymentType: "Nexio-AUTH",  status: "Pending", salesBy: "Shoaib Ali",
    services: [{ name: "Premium Trademark Package", price: 1500 }],
  },
  {
    id: 8, invoiceNumber: "TO-AN-2512-16133", custName: "Brandon Sellam",           custEmail: "Brandon.sellam@gmail.com",         custPhone: "",              source: "IntelTrademark", currency: "Dollar", amount: 350,  date: "Dec, 05 2025", dueDate: "Dec, 05 2025", paymentType: "Nexio-AUTH",  status: "Pending", salesBy: "Fariz",
    services: [{ name: "Trademark Registration", price: 350 }],
  },
];

const INV_SOURCES = ["All Invoices", "IntelTrademark", "Office101", "Office102"];

function genInvoiceNumber(counter: number) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `TO-AN-${yy}${mm}-${counter}`;
}

const STATUSES = ["All Statuses", "Paid", "Pending"];

export function InvoicesTable() {
  const [invoices, setInvoices]         = useState<Invoice[]>(SEED);
  const [addOpen, setAddOpen]           = useState(false);
  const [previewInv, setPreviewInv]     = useState<Invoice | null>(null);
  const [editInv, setEditInv]           = useState<Invoice | null>(null);
  const [search, setSearch]             = useState("");
  const [sourceFilter, setSourceFilter] = useState("All Invoices");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const invCounter = useRef(16300);

  const filtered = invoices.filter(inv => {
    const matchSrc  = sourceFilter === "All Invoices" ? true : inv.source === sourceFilter;
    const matchStat = statusFilter === "All Statuses" ? true : inv.status === statusFilter;
    const matchSrch = search === "" ? true
      : inv.custName.toLowerCase().includes(search.toLowerCase())
      || inv.custEmail.toLowerCase().includes(search.toLowerCase())
      || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    return matchSrc && matchStat && matchSrch;
  });

  const handleGenerate = (data: InvoiceFormData) => {
    const total = data.services.reduce((s, sv) => s + sv.price, 0);
    const now   = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const newInv: Invoice = {
      id: invoices.length + 1,
      invoiceNumber: genInvoiceNumber(invCounter.current++),
      custName:    data.clientName,
      custEmail:   data.clientEmail,
      custPhone:   data.clientPhone,
      source:      data.source,
      currency:    data.currency,
      amount:      total,
      date:        dateStr,
      dueDate:     data.dueDate ? fmt(data.dueDate) : "—",
      paymentType: data.paymentType,
      status:      "Pending",
      salesBy:     "Alex Johnson",
      services:    data.services,
    };
    setInvoices(p => [newInv, ...p]);
    setAddOpen(false);
    setPreviewInv(newInv);
  };

  const handleUpdate = (data: InvoiceFormData) => {
    if (!editInv) return;
    const total = data.services.reduce((s, sv) => s + sv.price, 0);
    setInvoices(p => p.map(inv => inv.id === editInv.id ? {
      ...inv,
      custName: data.clientName, custEmail: data.clientEmail, custPhone: data.clientPhone,
      source: data.source, currency: data.currency, amount: total,
      dueDate: data.dueDate ? fmt(data.dueDate) : inv.dueDate,
      paymentType: data.paymentType, services: data.services,
    } : inv));
    setEditInv(null);
  };

  const deleteInvoice = (id: number) => {
    setInvoices(p => p.filter(inv => inv.id !== id));
  };

  const toFormData = (inv: Invoice): InvoiceFormData => ({
    clientEmail: inv.custEmail, clientName: inv.custName, clientPhone: inv.custPhone,
    source: inv.source, paymentType: inv.paymentType, currency: inv.currency, dueDate: "",
    services: inv.services,
  });

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Filters Toolbar ── */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          
          {/* Search Bar on Left (Expanded) */}
          <div className="flex-1 min-w-[280px]">
            <div className="relative flex items-center h-[34px]">
              <SearchIcon size={13} className="absolute left-3" style={{ color: "#94a3b8" }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
                placeholder="Search invoices by client or number..."
                className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm w-full h-full"
              />
            </div>
          </div>

          {/* Filters and Add button on Right */}
          <div className="flex flex-wrap items-end gap-3">
            {/* SOURCE Filter */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" style={{ color: "#94a3b8" }}>
                Source
              </span>
              <div className="relative">
                <select
                  value={sourceFilter}
                  onChange={(e) => { setSourceFilter(e.target.value); }}
                  className="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm h-[34px] min-w-[140px] appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                    backgroundSize: '8px 8px',
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {INV_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s === "All Invoices" ? "All Sources" : s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STATUS Filter */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" style={{ color: "#94a3b8" }}>
                Status
              </span>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); }}
                  className="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm h-[34px] min-w-[140px] appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                    backgroundSize: '8px 8px',
                    backgroundPosition: 'right 12px center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {STATUSES.map((stat) => (
                    <option key={stat} value={stat}>
                      {stat === "All Statuses" ? "All Status" : stat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Invoice button */}
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm hover:shadow h-[34px]"
              style={{ backgroundColor: NAVY }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Add Invoice
            </button>
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200/50 rounded-xl overflow-auto flex-1 shadow-sm">
        <table className="w-full border-collapse" style={{ minWidth: 1100 }}>
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100">
              {["#","Cust Name","Cust Email","Invoice Number","Amount","Date","Due Date","Payment Type","Source","Status","Payment/Void Date","Sales By","Action"].map(col => (
                <th key={col}
                  className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70">
            {filtered.map((inv, i) => (
              <tr key={inv.id}
                className="hover:bg-slate-50/40 transition-colors"
              >
                <td className="px-5 py-4 text-[12px] font-medium text-slate-400 whitespace-nowrap">{i + 1}</td>
                <td className="px-5 py-4">
                  <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap">{inv.custName}</span>
                </td>
                <td className="px-5 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{inv.custEmail}</td>
                <td className="px-5 py-4">
                  <span className="text-[11px] font-bold whitespace-nowrap px-2 py-0.5 rounded-md border"
                    style={{ backgroundColor: "#eff6ff50", borderColor: "#bfdbfe50", color: "#1d4ed8" }}>
                    {inv.invoiceNumber}
                  </span>
                </td>
                <td className="px-5 py-4 text-[13px] font-semibold text-slate-800 whitespace-nowrap">
                  {CURRENCY_SYM[inv.currency] ?? "$"}{inv.amount.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-[13px] font-medium text-slate-650 whitespace-nowrap">{inv.date}</td>
                <td className="px-5 py-4 text-[13px] font-medium text-slate-650 whitespace-nowrap">{inv.dueDate}</td>
                <td className="px-5 py-4 text-[13px] font-medium text-slate-650 whitespace-nowrap">{inv.paymentType}</td>
                <td className="px-5 py-4">
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap"
                    style={{
                      backgroundColor: inv.source === "IntelTrademark" ? "#fef3c750" : inv.source === "Office101" ? "#eff6ff50" : "#f0fdf450",
                      borderColor:     inv.source === "IntelTrademark" ? "#fde68a50" : inv.source === "Office101" ? "#bfdbfe50" : "#bbf7d050",
                      color:           inv.source === "IntelTrademark" ? "#b45309" : inv.source === "Office101" ? "#1d4ed8" : "#15803d",
                    }}>
                    {inv.source}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap"
                    style={{
                      backgroundColor: inv.status === "Paid" ? "#f0fdf450" : "#fef3c750",
                      borderColor:     inv.status === "Paid" ? "#bbf7d050" : "#fde68a50",
                      color:           inv.status === "Paid" ? "#15803d" : "#b45309",
                    }}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{inv.paymentVoidDate ?? "—"}</td>
                <td className="px-5 py-4 text-[13px] font-medium text-slate-600 whitespace-nowrap">{inv.salesBy}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPreviewInv(inv)} title="View Invoice"
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-150 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200/50 transition-all cursor-pointer shadow-sm"
                    >
                      <Eye size={13} />
                    </button>
                    {inv.status === "Pending" && (
                      <>
                        <button onClick={() => setEditInv(inv)} title="Edit Invoice"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-150 bg-white text-slate-400 hover:text-purple-600 hover:bg-purple-50/50 hover:border-purple-200/50 transition-all cursor-pointer shadow-sm"
                        >
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteInvoice(inv.id)} title="Delete Invoice"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-150 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200/50 transition-all cursor-pointer shadow-sm"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    {inv.status === "Paid" && (
                      <button title="Print Invoice" onClick={() => window.print()}
                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-150 bg-white text-slate-400 hover:text-slate-650 hover:bg-slate-50/50 hover:border-slate-200/50 transition-all cursor-pointer shadow-sm"
                      >
                        <Printer size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-12 text-center text-sm" style={{ color: "#9ca3af" }}>
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddInvoiceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onGenerate={handleGenerate}
      />
      <AddInvoiceModal
        open={!!editInv}
        onClose={() => setEditInv(null)}
        onGenerate={handleUpdate}
        initialData={editInv ? toFormData(editInv) : undefined}
      />
      <InvoicePreviewModal
        invoice={previewInv}
        onClose={() => setPreviewInv(null)}
      />
    </div>
  );
}

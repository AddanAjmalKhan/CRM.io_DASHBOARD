import type { Invoice } from "@/components/dashboard/InvoicesTable";

const SYM: Record<string, string> = {
  Dollar: "$", Euro: "€", "British Pound": "£", "Canadian Dollar": "CA$",
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printInvoice(invoice: Invoice) {
  const sym = SYM[invoice.currency] ?? "$";

  const rows = invoice.services.map(s => `
    <div class="row">
      <span>${esc(s.name)}</span>
      <span>${esc(sym)}${s.price.toFixed(2)}</span>
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${esc(invoice.invoiceNumber)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;background:#f8fafc}
    @media print{
      body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .no-print{display:none!important}
    }
    .page{max-width:680px;margin:40px auto;padding-bottom:40px}
    /* ── Header ── */
    .hd{background:#161642;padding:32px;border-radius:12px 12px 0 0}
    .hd-top{display:flex;align-items:flex-start;justify-content:space-between}
    .logo{display:flex;align-items:center;gap:12px}
    .icon{width:40px;height:40px;background:#2f6bf2;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .co{font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:white}
    .co-sub{font-size:11px;color:rgba(255,255,255,.4);margin-top:2px}
    .inv-title{font-size:26px;font-weight:900;letter-spacing:3px;color:white;text-align:right}
    .inv-num{font-size:11px;font-family:monospace;color:rgba(255,255,255,.6);margin-top:4px;text-align:right}
    .meta{display:flex;gap:28px;margin-top:24px;flex-wrap:wrap}
    .mi label{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.4);display:block;margin-bottom:3px}
    .mi span{font-size:13px;font-weight:700;color:white}
    .mi span.pending{color:#60a5fa}
    .mi span.paid{color:#4ade80}
    /* ── Body ── */
    .bd{background:white;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px}
    .bill{padding:24px 32px;border-bottom:1px solid #f1f5f9}
    .sec-lbl{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;font-weight:700;margin-bottom:8px}
    .cn{font-size:14px;font-weight:700;color:#161642}
    .cs{font-size:13px;color:#6b7280;margin-top:3px}
    .svc{padding:24px 32px}
    .svc-hd{display:flex;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid #f1f5f9;margin-bottom:2px}
    .svc-hd span{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;font-weight:700}
    .row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f9fafb;font-size:13px;color:#374151}
    .row span:last-child{font-weight:600;color:#161642}
    .total{display:flex;justify-content:space-between;align-items:center;padding-top:16px;margin-top:4px}
    .total-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af}
    .total-amt{font-size:24px;font-weight:900;color:#161642}
    /* ── Footer ── */
    .foot{text-align:center;margin-top:20px;font-size:11px;color:#9ca3af}
    .print-btn{display:block;margin:24px auto 0;padding:12px 36px;background:#161642;color:white;border:none;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:1px}
  </style>
</head>
<body>
<div class="page">
  <div class="hd">
    <div class="hd-top">
      <div class="logo">
        <div class="icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M10.5 2L4 10H9L7.5 16L14 8H9L10.5 2Z" fill="white"/>
          </svg>
        </div>
        <div>
          <div class="co">Business Hub</div>
          <div class="co-sub">businesshub.com</div>
        </div>
      </div>
      <div>
        <div class="inv-title">INVOICE</div>
        <div class="inv-num">#${esc(invoice.invoiceNumber)}</div>
      </div>
    </div>
    <div class="meta">
      <div class="mi"><label>Date</label><span>${esc(invoice.date)}</span></div>
      <div class="mi"><label>Due Date</label><span>${esc(invoice.dueDate || "—")}</span></div>
      <div class="mi"><label>Status</label><span class="${invoice.status.toLowerCase()}">${esc(invoice.status)}</span></div>
      <div class="mi"><label>Payment</label><span>${esc(invoice.paymentType)}</span></div>
      ${invoice.salesBy ? `<div class="mi"><label>Sales By</label><span>${esc(invoice.salesBy)}</span></div>` : ""}
    </div>
  </div>
  <div class="bd">
    <div class="bill">
      <div class="sec-lbl">Bill To</div>
      <div class="cn">${esc(invoice.custName)}</div>
      ${invoice.custEmail ? `<div class="cs">${esc(invoice.custEmail)}</div>` : ""}
      ${invoice.custPhone ? `<div class="cs">${esc(invoice.custPhone)}</div>` : ""}
    </div>
    <div class="svc">
      <div class="svc-hd"><span>Service</span><span>Amount</span></div>
      ${rows}
      <div class="total">
        <span class="total-lbl">Total</span>
        <span class="total-amt">${esc(sym)}${invoice.amount.toFixed(2)}</span>
      </div>
    </div>
  </div>
  <div class="foot">Thank you for your business.</div>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=820,height=950");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

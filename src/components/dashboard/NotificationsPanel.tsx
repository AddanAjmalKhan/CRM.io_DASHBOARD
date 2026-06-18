import { Button } from "@/components/ui/Button";

const ACCENT = "#2f6bf2";
const NAVY   = "#161642";

const notifications = [
  {
    id: 1,
    from: "Sarah Miller",
    initials: "SM",
    color: "#3b82f6",
    message: "Assigned you a new lead from Office101",
    time: "10 Jun 2026 · 10:00 AM",
    action: "View Lead",
  },
  {
    id: 2,
    from: "IntelTrademark",
    initials: "IT",
    color: "#10b981",
    message: "Invoice #INV-2048 has been approved",
    time: "10 Jun 2026 · 09:15 AM",
    action: "View Invoice",
  },
];

export function NotificationsPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: "#111827" }}>Notification</h2>
        <button className="text-xs font-semibold transition-colors hover:opacity-70" style={{ color: ACCENT }}>
          View all
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {notifications.map(n => (
          <div
            key={n.id}
            className="flex items-start gap-4 p-4 rounded-2xl"
            style={{ backgroundColor: NAVY }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ backgroundColor: n.color }}
            >
              {n.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">{n.from}</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {n.message}
              </p>
              <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>{n.time}</p>
              <div className="mt-3">
                <Button variant="primary" size="sm" className="text-xs px-3 py-1.5 rounded-lg">
                  {n.action}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

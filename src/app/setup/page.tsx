"use client";
import { useState } from "react";

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleCreate = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_SETUP_SECRET || "crm-setup-2024" }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error); setStatus("error"); return; }
      setMsg("Admin created! You can now log in with test@admin.com / testing123");
      setStatus("done");
    } catch {
      setMsg("Network error. Try again.");
      setStatus("error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 40, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#161642", marginBottom: 8 }}>One-Time Admin Setup</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 28 }}>
          This creates the admin account:<br />
          <strong style={{ color: "#161642" }}>test@admin.com</strong> / <strong style={{ color: "#161642" }}>testing123</strong>
        </p>

        {status === "done" ? (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 16, color: "#15803d", fontSize: 13, fontWeight: 600 }}>
            ✓ {msg}<br /><br />
            <a href="/login" style={{ color: "#2f6bf2", fontWeight: 700 }}>Go to Login →</a>
          </div>
        ) : (
          <>
            {msg && (
              <div style={{ background: status === "error" ? "#fef2f2" : "#f0fdf4", border: `1px solid ${status === "error" ? "#fecaca" : "#bbf7d0"}`, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: status === "error" ? "#dc2626" : "#15803d", fontWeight: 600 }}>
                {msg}
              </div>
            )}
            <button onClick={handleCreate} disabled={status === "loading"}
              style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: "#161642", color: "white", fontWeight: 900, fontSize: 13, border: "none", cursor: status === "loading" ? "not-allowed" : "pointer", opacity: status === "loading" ? 0.6 : 1, letterSpacing: "0.05em" }}>
              {status === "loading" ? "Creating…" : "Create Admin Account"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

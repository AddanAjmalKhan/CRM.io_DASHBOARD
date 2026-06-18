"use client";

import { useEffect, useState } from "react";
import {
  User, Lock, Bell, Globe, Shield, Palette,
  Check, Eye, EyeOff, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";

const NAVY   = "#161642";
const ACCENT = "#EAB308";

type Section = "profile" | "security" | "notifications" | "websites" | "appearance" | "privacy";

const SECTIONS: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "profile",       label: "Profile",       icon: User,    desc: "Name, email and personal info" },
  { id: "security",      label: "Security",      icon: Lock,    desc: "Password and login settings" },
  { id: "notifications", label: "Notifications", icon: Bell,    desc: "Email and in-app alerts" },
  { id: "websites",      label: "Websites",      icon: Globe,   desc: "Manage your 3 business sites" },
  { id: "appearance",    label: "Appearance",    icon: Palette, desc: "Theme and display preferences" },
  { id: "privacy",       label: "Privacy",       icon: Shield,  desc: "Data and account visibility" },
];

/* ── Toggle switch ── */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0"
      style={{ backgroundColor: checked ? ACCENT : "#e2e8f0", height: 22, width: 40 }}
    >
      <span
        className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

/* ── Section wrapper ── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e8edf5" }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: "#f1f5f9", backgroundColor: "#fafbfc" }}>
        <p className="text-sm font-bold" style={{ color: NAVY }}>{title}</p>
      </div>
      <div className="px-6 py-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

/* ── Field row ── */
function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#374151" }}>{label}</p>
        {hint && <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

/* ── Inline input ── */
function InlineInput({ value, onChange, type = "text", placeholder = "" }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  const isPassword = type === "password";
  return (
    <div className="relative">
      <input
        type={isPassword ? (show ? "text" : "password") : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="rounded-lg px-3 py-2 text-sm outline-none border w-56 transition-all"
        style={{
          borderColor: focused ? ACCENT : "#e2e8f0",
          boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : "none",
          color: NAVY,
          paddingRight: isPassword ? "2.5rem" : undefined,
        }}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      )}
    </div>
  );
}

const WEBSITE_DATA = [
  { key: "IntelTrademark", label: "IntelTrademark",  url: "inteltrademark.com",  email: "info@inteltrademark.com",  color: "#7c3aed", bg: "#ede9fe" },
  { key: "Office101",      label: "Office 101 LLC",  url: "office101llc.com",    email: "info@office101llc.com",    color: "#2563eb", bg: "#dbeafe" },
  { key: "Office102",      label: "Office 102 LLC",  url: "office102llc.com",    email: "info@office102llc.com",    color: "#059669", bg: "#d1fae5" },
];

export function SettingsPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<Section>("profile");

  /* Profile */
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  /* Security */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaved,   setPwSaved]   = useState(false);

  /* Notifications */
  const [notifs, setNotifs] = useState({
    emailLeads:    true,
    emailInvoices: true,
    emailReplies:  true,
    browserAlerts: false,
    weeklyDigest:  true,
    marketingEmails: false,
  });

  /* Appearance */
  const [compactMode,  setCompactMode]  = useState(false);
  const [showAvatars,  setShowAvatars]  = useState(true);
  const [animateCards, setAnimateCards] = useState(true);

  /* Privacy */
  const [twoFactor,    setTwoFactor]    = useState(false);
  const [activityLog,  setActivityLog]  = useState(true);
  const [sessionAlert, setSessionAlert] = useState(true);

  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    const supabase = createClient();
    if (user?.id) {
      await supabase.from('users').update({ name: name.trim() }).eq('id', user.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSavePw = async () => {
    if (!newPw.trim() || newPw !== confirmPw) return;
    const supabase = createClient();
    await supabase.auth.updateUser({ password: newPw });
    setPwSaved(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSaved(false), 2500);
  };

  return (
    <div className="flex gap-6 h-full">

      {/* ── Left nav ── */}
      <div className="w-56 flex-shrink-0 flex flex-col gap-1">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const isActive = active === s.id;
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full"
              style={{
                backgroundColor: isActive ? ACCENT : "transparent",
                boxShadow: isActive ? `0 4px 12px ${ACCENT}40` : "none",
              }}>
              <Icon size={16} style={{ color: isActive ? NAVY : "#94a3b8" }} strokeWidth={isActive ? 2.2 : 1.7} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight"
                  style={{ color: isActive ? NAVY : "#374151" }}>{s.label}</p>
              </div>
              {isActive && <ChevronRight size={13} style={{ color: NAVY }} />}
            </button>
          );
        })}
      </div>

      {/* ── Right content ── */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">

        {/* ── Profile ── */}
        {active === "profile" && (
          <>
            <SectionCard title="Personal Information">
              <FieldRow label="Full Name" hint="Your display name across the dashboard">
                <InlineInput value={name} onChange={setName} placeholder="Full name" />
              </FieldRow>
              <FieldRow label="Email Address" hint="Used for login and notifications">
                <InlineInput value={email} onChange={setEmail} type="email" placeholder="email@example.com" />
              </FieldRow>
              <FieldRow label="Role" hint="Your permission level — contact admin to change">
                <span className="text-sm font-semibold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: `${ACCENT}20`, color: NAVY }}>
                  {user?.role ?? "Admin"}
                </span>
              </FieldRow>
            </SectionCard>

            <SectionCard title="Connected Websites">
              {WEBSITE_DATA.map(w => (
                <FieldRow key={w.key} label={w.label} hint={w.url}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: w.bg, color: w.color }}>
                      {w.email}
                    </span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                  </div>
                </FieldRow>
              ))}
            </SectionCard>

            <button onClick={handleSaveProfile}
              className="self-start flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: saved ? "#22c55e" : NAVY }}>
              {saved ? <><Check size={14} /> Saved!</> : "Save Changes"}
            </button>
          </>
        )}

        {/* ── Security ── */}
        {active === "security" && (
          <>
            <SectionCard title="Change Password">
              <FieldRow label="Current Password">
                <InlineInput value={currentPw} onChange={setCurrentPw} type="password" placeholder="Current password" />
              </FieldRow>
              <FieldRow label="New Password" hint="Minimum 8 characters">
                <InlineInput value={newPw} onChange={setNewPw} type="password" placeholder="New password" />
              </FieldRow>
              <FieldRow label="Confirm Password">
                <InlineInput value={confirmPw} onChange={setConfirmPw} type="password" placeholder="Confirm new password" />
              </FieldRow>
              {newPw && confirmPw && newPw !== confirmPw && (
                <p className="text-xs" style={{ color: "#ef4444" }}>Passwords do not match.</p>
              )}
            </SectionCard>

            <SectionCard title="Login Sessions">
              <FieldRow label="Active Sessions" hint="You are currently logged in on 1 device">
                <button className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
                  Sign out all devices
                </button>
              </FieldRow>
              <FieldRow label="Last Login" hint="Session details">
                <span className="text-sm font-semibold" style={{ color: "#374151" }}>
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </FieldRow>
            </SectionCard>

            <button onClick={handleSavePw}
              disabled={!newPw || newPw !== confirmPw}
              className="self-start flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: pwSaved ? "#22c55e" : NAVY }}>
              {pwSaved ? <><Check size={14} /> Updated!</> : "Update Password"}
            </button>
          </>
        )}

        {/* ── Notifications ── */}
        {active === "notifications" && (
          <>
            <SectionCard title="Email Notifications">
              {[
                { key: "emailLeads",    label: "New lead received",      hint: "Alert when a new lead comes in from any website" },
                { key: "emailInvoices", label: "Invoice status updates",  hint: "When an invoice is paid or overdue" },
                { key: "emailReplies",  label: "Email replies",           hint: "When a lead replies to your email" },
                { key: "weeklyDigest",  label: "Weekly digest",           hint: "Summary of activity every Monday morning" },
                { key: "marketingEmails", label: "Product updates",       hint: "Business Hub feature announcements" },
              ].map(n => (
                <FieldRow key={n.key} label={n.label} hint={n.hint}>
                  <ToggleSwitch
                    checked={notifs[n.key as keyof typeof notifs]}
                    onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))}
                  />
                </FieldRow>
              ))}
            </SectionCard>
            <SectionCard title="Browser Notifications">
              <FieldRow label="Desktop alerts" hint="Show notifications in your browser">
                <ToggleSwitch checked={notifs.browserAlerts} onChange={v => setNotifs(p => ({ ...p, browserAlerts: v }))} />
              </FieldRow>
            </SectionCard>
          </>
        )}

        {/* ── Websites ── */}
        {active === "websites" && (
          <div className="flex flex-col gap-4">
            {WEBSITE_DATA.map(w => (
              <div key={w.key} className="bg-white rounded-xl border p-5 flex flex-col gap-4"
                style={{ borderColor: "#e8edf5" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: w.bg }}>
                    <Globe size={18} style={{ color: w.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: NAVY }}>{w.label}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{w.url}</p>
                  </div>
                  <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Inbox Email", value: w.email },
                    { label: "Domain",      value: w.url },
                  ].map(f => (
                    <div key={f.label} className="rounded-lg p-3" style={{ backgroundColor: "#f8fafc" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#94a3b8" }}>{f.label}</p>
                      <p className="text-xs font-semibold truncate" style={{ color: NAVY }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Appearance ── */}
        {active === "appearance" && (
          <>
            <SectionCard title="Display">
              <FieldRow label="Compact mode" hint="Reduce row padding for denser tables">
                <ToggleSwitch checked={compactMode} onChange={setCompactMode} />
              </FieldRow>
              <FieldRow label="Show avatars" hint="Display user initials in tables and lists">
                <ToggleSwitch checked={showAvatars} onChange={setShowAvatars} />
              </FieldRow>
              <FieldRow label="Card animations" hint="Hover lift and transition effects">
                <ToggleSwitch checked={animateCards} onChange={setAnimateCards} />
              </FieldRow>
            </SectionCard>
            <SectionCard title="Brand Colors">
              <FieldRow label="Accent Color" hint="Used for active states and highlights">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: ACCENT }} />
                  <span className="text-sm font-mono font-semibold" style={{ color: NAVY }}>{ACCENT}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#fefce8", color: "#92400e" }}>
                    Yellow
                  </span>
                </div>
              </FieldRow>
              <FieldRow label="Primary Color" hint="Used for sidebar and navigation">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: NAVY }} />
                  <span className="text-sm font-mono font-semibold" style={{ color: NAVY }}>{NAVY}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eef2ff", color: "#3730a3" }}>
                    Navy
                  </span>
                </div>
              </FieldRow>
            </SectionCard>
          </>
        )}

        {/* ── Privacy ── */}
        {active === "privacy" && (
          <>
            <SectionCard title="Account Security">
              <FieldRow label="Two-factor authentication" hint="Require a code in addition to your password">
                <ToggleSwitch checked={twoFactor} onChange={setTwoFactor} />
              </FieldRow>
              <FieldRow label="Activity log" hint="Keep a record of actions taken in the dashboard">
                <ToggleSwitch checked={activityLog} onChange={setActivityLog} />
              </FieldRow>
              <FieldRow label="New session alerts" hint="Email me when a new login is detected">
                <ToggleSwitch checked={sessionAlert} onChange={setSessionAlert} />
              </FieldRow>
            </SectionCard>
            <SectionCard title="Data">
              <FieldRow label="Export data" hint="Download all your leads, invoices, and settings">
                <button className="text-xs font-semibold px-4 py-2 rounded-full transition-colors hover:opacity-80"
                  style={{ backgroundColor: `${NAVY}10`, color: NAVY }}>
                  Export CSV
                </button>
              </FieldRow>
              <FieldRow label="Delete account" hint="Permanently remove all data — this cannot be undone">
                <button className="text-xs font-semibold px-4 py-2 rounded-full transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
                  Delete Account
                </button>
              </FieldRow>
            </SectionCard>
          </>
        )}

      </div>
    </div>
  );
}

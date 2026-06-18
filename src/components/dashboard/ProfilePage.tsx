"use client";

import { useEffect, useState } from "react";
import { Check, ShieldCheck, UserCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";

const NAVY   = "#161642";
const ACCENT = "#EAB308";

function Field({
  label, value, onChange, type = "text", placeholder = "", readOnly = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: NAVY }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder} readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
        style={{
          border: `1.5px solid ${focused && !readOnly ? ACCENT : "#e2e8f0"}`,
          boxShadow: focused && !readOnly ? `0 0 0 3px ${ACCENT}18` : "none",
          color: NAVY,
          backgroundColor: readOnly ? "#f8fafc" : "#fff",
          cursor: readOnly ? "not-allowed" : "text",
        }}
      />
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); }
  }, [user]);

  const role = user?.role ?? "Agent";
  const isAdmin = role === "Admin";
  const avatarInitials = name.trim().split(" ").filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join("") || "?";

  const handleUpdate = async () => {
    setError("");
    const supabase = createClient();
    if (user?.id) {
      const { error: profileError } = await supabase
        .from('users')
        .update({ name: name.trim() || name })
        .eq('id', user.id);
      if (profileError) { setError(profileError.message); return; }
    }
    if (password) {
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) { setError(pwError.message); return; }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Navy banner */}
      <div className="rounded-2xl flex items-center justify-center py-7" style={{ backgroundColor: NAVY }}>
        <h1 className="text-2xl font-black tracking-[0.25em] text-white uppercase">Profile</h1>
      </div>

      {/* Card */}
      <div className="rounded-2xl shadow-sm border bg-white overflow-hidden mx-auto w-full"
        style={{ borderColor: "#e8edf5", maxWidth: 900 }}>

        {/* Avatar + name strip */}
        <div className="flex items-center gap-5 px-8 py-6 border-b" style={{ borderColor: "#f1f5f9" }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0"
            style={{
              backgroundColor: ACCENT,
              color: NAVY,
            }}
          >
            {avatarInitials}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-black" style={{ color: NAVY }}>{name || ""}</p>
            <p className="text-sm" style={{ color: "#9ca3af" }}>{email || ""}</p>
            <span
              className="self-start flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mt-0.5"
              style={{ backgroundColor: `${ACCENT}20`, color: NAVY }}
            >
              {isAdmin ? <ShieldCheck size={12} /> : <UserCircle2 size={12} />}
              {role}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-7 flex flex-col gap-5">
          {error && (
            <p className="text-sm font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-6">
            <Field label="Name"  value={name}  onChange={setName}  placeholder="Full name" />
            <Field label="Email" value={email} readOnly type="email" placeholder="you@example.com" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: NAVY }}>Role</label>
              <div
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold"
                style={{ border: "1.5px solid #e2e8f0", backgroundColor: "#f8fafc", color: NAVY }}
              >
                {isAdmin ? <ShieldCheck size={15} /> : <UserCircle2 size={15} />}
                {role}
              </div>
            </div>
          </div>

          <Field
            label="New Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="Leave blank to keep current password"
          />

          <p className="text-sm" style={{ color: "#6b7280" }}>
            Email cannot be changed here. Contact your administrator.
          </p>

          <div>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-sm tracking-widest uppercase transition-all hover:opacity-90"
              style={{ backgroundColor: saved ? "#16a34a" : NAVY, color: "#fff" }}
            >
              {saved && <Check size={15} strokeWidth={3} />}
              {saved ? "Saved!" : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

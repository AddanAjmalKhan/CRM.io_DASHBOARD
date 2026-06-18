"use client";

import { useState } from "react";
import { AlertCircle, ShieldCheck, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { InputField } from "@/components/ui/InputField";
import { Toggle } from "@/components/ui/Toggle";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/auth-context";

const ACCENT = "#EAB308";
const NAVY   = "#161642";

export function LoginForm() {
  const [role,     setRole]     = useState<Role>("Admin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const router = useRouter();
  const { signIn, signOut } = useAuth();

  const DOMAIN: Record<Role, string> = { Admin: "@admin.com", Agent: "@agent.com" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    if (!email.endsWith(DOMAIN[role])) {
      setError(`${role} accounts must use a ${DOMAIN[role]} email address.`);
      return;
    }
    setLoading(true);
    const { user, error: authError } = await signIn(email, password);
    if (authError) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }
    if (user && user.role !== role) {
      await signOut();
      setLoading(false);
      setError(`This account is not registered as ${role === "Admin" ? "an Admin" : "an Agent"}.`);
      return;
    }
    setLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col gap-7 w-full">

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h1>
        <p className="text-sm font-semibold text-slate-500">
          Sign in to your Business Hub account
        </p>
      </div>

      {/* Role selector */}
      <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
        {(["Admin", "Agent"] as Role[]).map(r => (
          <button key={r} type="button" onClick={() => { setRole(r); setError(""); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer"
            style={role === r
              ? { backgroundColor: ACCENT, color: NAVY, boxShadow: `0 3px 12px ${ACCENT}55` }
              : { backgroundColor: "transparent", color: "#64748b" }
            }>
            {r === "Admin" ? <ShieldCheck size={14} /> : <UserCircle2 size={14} />}
            {r}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
          <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField
          label="Email address"
          type="email"
          placeholder={role === "Admin" ? "name@admin.com" : "name@agent.com"}
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          theme="light"
        />
        <InputField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          theme="light"
        />

        <Toggle
          checked={remember}
          onChange={e => setRemember(e.target.checked)}
          label="Stay signed in"
          description="Keep me logged in on this device"
          theme="light"
          accentColor={ACCENT}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-black text-sm tracking-widest uppercase transition-all hover:opacity-90 disabled:opacity-60 mt-1 cursor-pointer"
          style={{
            backgroundColor: ACCENT,
            color: NAVY,
            boxShadow: loading ? "none" : `0 6px 24px ${ACCENT}50`,
          }}
        >
          {loading ? "Signing in…" : `Sign In as ${role}`}
        </button>
      </form>
    </div>
  );
}

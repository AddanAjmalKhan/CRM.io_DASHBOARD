import { DecorativePanel } from "@/components/auth/DecorativePanel";
import { LoginForm } from "@/components/auth/LoginForm";

const ACCENT = "#ff6b4a";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0b0f19" }}>
      <DecorativePanel />

      {/* Right panel — white, form directly on background */}
      <div className="flex-1 flex flex-col relative login-panel" style={{ backgroundColor: "#ffffff" }}>

        {/* Very subtle top-right ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" style={{
          background: `radial-gradient(ellipse at 100% 0%, rgba(255,107,74,0.05) 0%, transparent 65%)`,
        }} />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 px-8 pt-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
              <path d="M10.5 2L4 10H9L7.5 16L14 8H9L10.5 2Z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-sm text-slate-800">Business Hub</span>
        </div>

        {/* Form — centered, no card wrapper */}
        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <div className="w-full max-w-[400px]">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

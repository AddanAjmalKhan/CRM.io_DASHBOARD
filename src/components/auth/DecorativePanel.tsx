import { IntelTrademarkLogo, Office101Logo, Office102Logo } from "@/components/brand/Logos";

const ACCENT = "#2f6bf2";

const features = [
  "Real-time lead pipeline across all sites",
  "Invoice & billing automation",
  "Multi-site business management",
  "Advanced analytics & reporting",
];

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" stroke={ACCENT} strokeWidth="1.5" />
      <path d="M5.5 9.5L7.8 11.8L12.5 6.5" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DecorativePanel() {
  return (
    <div
      className="hidden lg:flex flex-col w-[45%] min-h-screen relative overflow-hidden"
      style={{ backgroundColor: "#0b0f19" }}
    >
      {/* ── Lumma-style top-crown glow — blue/black ── */}
      {/* Wide outer halo — radiates down from top edge */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 100% 65% at 48% -5%, rgba(47,107,242,0.22) 0%, rgba(30,64,175,0.08) 55%, transparent 75%)`,
      }} />
      {/* Mid glow — anchored just above top, fans down */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 85% 58% at 46% -2%, rgba(47,107,242,0.50) 0%, rgba(37,99,235,0.18) 45%, transparent 68%)`,
        filter: "blur(10px)",
      }} />
      {/* Core bright blob — centre of the crown */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 70% 50% at 45% 0%, rgba(147,197,253,0.80) 0%, rgba(47,107,242,0.52) 28%, rgba(30,64,175,0.12) 58%, transparent 72%)`,
        filter: "blur(4px)",
      }} />
      {/* Inner hot-spot — tiny super-bright peak at very top */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 45% 30% at 44% -3%, rgba(219,234,254,0.65) 0%, rgba(47,107,242,0.22) 48%, transparent 68%)`,
        filter: "blur(1px)",
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full min-h-screen px-12 py-10">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 20px ${ACCENT}60` }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M10.5 2L4 10H9L7.5 16L14 8H9L10.5 2Z" fill="white" />
            </svg>
          </div>
          <span className="text-white font-black text-sm tracking-widest uppercase">Business Hub</span>
        </div>

        {/* Hero */}
        <div className="flex flex-col justify-center flex-1 gap-7 max-w-sm">
          <div>
            <h1 className="text-4xl font-black leading-tight text-white">Convert leads</h1>
            <h1 className="text-4xl font-black leading-tight" style={{ color: ACCENT }}>into clients.</h1>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
            The all-in-one platform to manage Office101, Office102 &amp; IntelTrademark — with speed and clarity.
          </p>
          <ul className="flex flex-col gap-3.5">
            {features.map(f => (
              <li key={f} className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Connected platforms */}
        <div className="flex flex-col gap-4">
          <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>
            Connected Platforms
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <div style={{ opacity: 0.75 }}><IntelTrademarkLogo height={26} /></div>
            <div style={{ opacity: 0.75 }}><Office101Logo height={26} /></div>
            <div style={{ opacity: 0.75 }}><Office102Logo height={26} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

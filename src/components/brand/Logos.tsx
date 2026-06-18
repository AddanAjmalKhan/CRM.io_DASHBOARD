/* ─────────────────────────────────────────
   Shared Office hub mark:
   4 rounded blob nodes in an X/cross pattern
   Top 2 = white, Bottom 2 = orange
───────────────────────────────────────── */
function OfficeMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* White arms from upper blobs to center */}
      <line x1="26" y1="26" x2="50" y2="50" stroke="white" strokeWidth="11" strokeLinecap="round" />
      <line x1="74" y1="26" x2="50" y2="50" stroke="white" strokeWidth="11" strokeLinecap="round" />
      {/* Orange arms from lower blobs to center (painted on top) */}
      <line x1="74" y1="74" x2="50" y2="50" stroke="#C84B11" strokeWidth="11" strokeLinecap="round" />
      <line x1="26" y1="74" x2="50" y2="50" stroke="#C84B11" strokeWidth="11" strokeLinecap="round" />
      {/* White blobs — top-left, top-right */}
      <circle cx="26" cy="26" r="14" fill="white" />
      <circle cx="74" cy="26" r="14" fill="white" />
      {/* Orange blobs — bottom-right, bottom-left */}
      <circle cx="74" cy="74" r="14" fill="#C84B11" />
      <circle cx="26" cy="74" r="14" fill="#C84B11" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Office 101 LLC
───────────────────────────────────────── */
export function Office101Logo({ height = 40 }: { height?: number }) {
  const scale = height / 40;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(8 * scale) }}>
      <OfficeMark size={Math.round(height * 1.1)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: Math.round(21 * scale), fontWeight: 800, color: "white", lineHeight: 1.15, fontFamily: "Arial, sans-serif" }}>Office</span>
        <span style={{ fontSize: Math.round(16 * scale), fontWeight: 900, color: "#C84B11", lineHeight: 1.15, fontFamily: "Arial, sans-serif", letterSpacing: 1 }}>101 LLC</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Office 102 LLC
───────────────────────────────────────── */
export function Office102Logo({ height = 40 }: { height?: number }) {
  const scale = height / 40;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(8 * scale) }}>
      <OfficeMark size={Math.round(height * 1.1)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: Math.round(21 * scale), fontWeight: 800, color: "white", lineHeight: 1.15, fontFamily: "Arial, sans-serif" }}>Office</span>
        <span style={{ fontSize: Math.round(16 * scale), fontWeight: 900, color: "#C84B11", lineHeight: 1.15, fontFamily: "Arial, sans-serif", letterSpacing: 1 }}>102 LLC</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   IntelTrademark
   Shield (navy + gold chevron + white I-spool + TM badge)
   + INTEL bold white | gold rule | TRADEMARK gold tracked
───────────────────────────────────────── */
export function IntelTrademarkLogo({ height = 44 }: { height?: number }) {
  const shieldW = Math.round(height * 0.68);
  const scale = height / 60;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(9 * scale) }}>

      {/* Shield SVG */}
      <svg
        width={shieldW}
        height={height}
        viewBox="0 0 42 60"
        fill="none"
        style={{ overflow: "visible", flexShrink: 0 }}
      >
        {/* Shield body */}
        <path d="M21 1 L3 9 L3 31 C3 45 11 54 21 58 C31 54 39 45 39 31 L39 9 Z" fill="#1a2460" />
        {/* Gold chevron stripe */}
        <path d="M3 9 L21 1 L39 9 L39 19 L21 12 L3 19 Z" fill="#D4A017" />
        {/* White I-beam / spool */}
        {/* Top bar */}
        <rect x="11" y="22" width="20" height="6" rx="1.5" fill="white" />
        {/* Stem */}
        <rect x="17" y="28" width="8" height="9" rx="1" fill="white" />
        {/* Bottom bar */}
        <rect x="11" y="37" width="20" height="6" rx="1.5" fill="white" />
        {/* TM badge — upper-right, partially overlaps shield edge */}
        <circle cx="37" cy="16" r="6" fill="#D4A017" />
        <text
          x="31.8" y="19"
          fontSize="5.5"
          fontWeight="900"
          fill="#1a2460"
          fontFamily="Arial, sans-serif"
        >
          TM
        </text>
      </svg>

      {/* Text stack */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span style={{
          fontSize: Math.round(24 * scale),
          fontWeight: 900,
          color: "white",
          lineHeight: 1,
          fontFamily: "'Arial Black', Arial, sans-serif",
          letterSpacing: Math.round(2 * scale),
        }}>
          INTEL
        </span>
        <div style={{
          alignSelf: "stretch",
          height: Math.max(1, Math.round(2 * scale)),
          backgroundColor: "#D4A017",
          margin: `${Math.round(3 * scale)}px 0`,
        }} />
        <span style={{
          fontSize: Math.max(6, Math.round(8 * scale)),
          fontWeight: 700,
          color: "#D4A017",
          letterSpacing: Math.round(3 * scale),
          fontFamily: "Arial, sans-serif",
          textTransform: "uppercase" as const,
        }}>
          TRADEMARK
        </span>
      </div>

    </div>
  );
}

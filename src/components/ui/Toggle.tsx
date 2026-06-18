"use client";

import { InputHTMLAttributes, forwardRef } from "react";

const ACCENT = "#2f6bf2";

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  theme?: "dark" | "light";
  accentColor?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, theme = "dark", className = "", accentColor, ...props }, ref) => {
    const isLight = theme === "light";
    return (
      <label className="inline-flex items-start gap-3 cursor-pointer group">
        <div className="relative flex-shrink-0 mt-0.5">
          <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
          {/* Track */}
          <div
            className="w-9 h-5 rounded-full transition-all duration-200"
            style={{ backgroundColor: isLight ? "#e5e7eb" : "#1e1e2e", border: `1px solid ${isLight ? "#d1d5db" : "#2a2a3a"}` }}
          />
          {/* Checked track */}
          <div
            className="absolute inset-0 w-9 h-5 rounded-full opacity-0 peer-checked:opacity-100 transition-all duration-200"
            style={{ backgroundColor: accentColor || ACCENT }}
          />
          {/* Knob */}
          <div
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all duration-200 peer-checked:translate-x-4 z-10"
            style={{ backgroundColor: isLight ? "#9ca3af" : "#4a4a6a" }}
          />
          <div
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 peer-checked:translate-x-4 z-10 opacity-0 peer-checked:opacity-100"
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && <span className="text-sm leading-tight" style={{ color: isLight ? "#374151" : "#e2e8f0" }}>{label}</span>}
            {description && <span className="text-xs leading-snug" style={{ color: isLight ? "#9ca3af" : "#4a5568" }}>{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Toggle.displayName = "Toggle";

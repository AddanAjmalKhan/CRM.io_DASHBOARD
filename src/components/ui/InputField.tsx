"use client";

import { InputHTMLAttributes, forwardRef, useState, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

const ACCENT = "#2f6bf2";
const ERROR  = "#dc2626";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  hint?: string;
  theme?: "dark" | "light";
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, icon, error, hint, type = "text", theme = "dark", className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const isLight = theme === "light";

    const inputStyle = isLight
      ? { backgroundColor: "#f9fafb", border: `1px solid ${error ? ERROR : "#e5e7eb"}`, color: "#111827" }
      : { backgroundColor: "#0d0d1a", border: `1px solid ${error ? ERROR : "#1a1a2e"}`, color: "#e2e8f0" };

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-medium tracking-wide" style={{ color: "#6b7280" }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isLight ? "#9ca3af" : "#374151" }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            style={inputStyle}
            className={[
              "w-full rounded-lg py-2.5 px-3.5 text-sm transition-all duration-150 outline-none",
              isLight ? "theme-light" : "theme-dark",
              icon ? "pl-10" : "",
              isPassword ? "pr-10" : "",
              className,
            ].filter(Boolean).join(" ")}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: isLight ? "#9ca3af" : "#2d3748" }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>
        {error && <p className="text-xs" style={{ color: ERROR }}>{error}</p>}
        {hint && !error && <p className="text-xs" style={{ color: isLight ? "#9ca3af" : "#374151" }}>{hint}</p>}
      </div>
    );
  }
);

InputField.displayName = "InputField";

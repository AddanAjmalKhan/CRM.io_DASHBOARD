"use client";

import { ButtonHTMLAttributes, CSSProperties, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyle: Record<Variant, CSSProperties> = {
  primary:   { backgroundColor: "#2f6bf2", color: "#ffffff" },
  danger:    { backgroundColor: "#dc2626", color: "#ffffff" },
  secondary: { backgroundColor: "#111122", color: "#e2e8f0", border: "1px solid #1e1e35" },
  outline:   { backgroundColor: "transparent", color: "#e2e8f0", border: "1px solid #1e1e35" },
  ghost:     { backgroundColor: "transparent", color: "#6b7280" },
};

const sizeClass: Record<Size, string> = {
  sm: "px-4 py-1.5 text-xs rounded-md",
  md: "px-5 py-2.5 text-sm rounded-md",
  lg: "px-6 py-3 text-sm rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      style,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{ fontWeight: 600, ...variantStyle[variant], ...style }}
        className={[
          "relative inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          sizeClass[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </span>
        )}
        <span className={loading ? "invisible" : ""}>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";

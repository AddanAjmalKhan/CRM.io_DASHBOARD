"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function LogoutConfirmModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(22,22,66,0.45)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl bg-white flex flex-col p-6 border"
        style={{ borderColor: "#e8edf5" }}>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-50 text-red-500 flex-shrink-0">
            <LogOut size={18} className="ml-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 leading-tight">Confirm Logout</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">Are you sure you want to log out?</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          You will need to sign back in with your email and password to access the Business Hub dashboard next time.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#ef4444" }}
          >
            LOG OUT
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  let title = "Overview";
  if (pathname === "/dashboard") title = "Home";
  else if (pathname.startsWith("/dashboard/leads")) title = "Leads";
  else if (pathname.startsWith("/dashboard/invoices")) title = "Invoices";
  else if (pathname.startsWith("/dashboard/emails")) title = "Emails";
  else if (pathname.startsWith("/dashboard/agents")) title = "Agents";
  else if (pathname.startsWith("/dashboard/settings")) title = "Settings";
  else if (pathname.startsWith("/dashboard/profile")) title = "Profile";

  const displayName = user?.name ?? "User";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayEmail = user?.email ?? "";

  return (
    <header
      className="flex items-center justify-between px-8 h-[60px] border-b flex-shrink-0 bg-white"
      style={{ borderColor: "#e8edf5" }}
    >
      <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>

      <div className="flex items-center gap-4">
        <button className="relative p-1.5 rounded-full hover:bg-slate-50 transition-colors">
          <Bell size={18} className="text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-slate-50"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
              style={{ backgroundColor: "#EAB308", color: "#161642" }}
            >
              {displayInitial}
            </div>
            <span className="text-xs font-bold text-slate-600">{displayName}</span>
            <ChevronDown
              size={13}
              className="text-slate-400"
              style={{ transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-lg border overflow-hidden z-50 bg-white"
              style={{ borderColor: "#e8edf5" }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "#f1f5f9", backgroundColor: "#f8fafc" }}>
                <p className="text-xs font-bold truncate text-slate-800">{displayName}</p>
                <p className="text-[11px] mt-0.5 truncate text-slate-400">{displayEmail}</p>
                {user?.role && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: "#EAB308", color: "#161642" }}>
                    {user.role}
                  </span>
                )}
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-red-50 text-red-600"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LogoutConfirmModal
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await signOut();
          router.push("/login");
        }}
      />
    </header>
  );
}

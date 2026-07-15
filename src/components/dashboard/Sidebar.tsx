"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Settings, UserPlus, Mail, LogOut, Send, LayoutTemplate
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const DARK_NAVY  = "#0b0f19";
const ACCENT     = "#EAB308";
const NAVY       = "#161642";
const INACTIVE   = "rgba(255, 255, 255, 0.55)";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
  adminOnly?: boolean;
}

interface NavCategory {
  category: string;
  items: NavItem[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    category: "Management",
    items: [
      { label: "Home",      href: "/dashboard",          icon: LayoutDashboard, exact: true },
      { label: "Leads",     href: "/dashboard/leads",    icon: Users },
      { label: "Invoices",  href: "/dashboard/invoices", icon: FileText },
    ]
  },
  {
    category: "Connection",
    items: [
      { label: "Emails",    href: "/dashboard/emails",   icon: Mail },
    ]
  },
  {
    category: "Tools",
    items: [
      { label: "Submissions", href: "/dashboard/submissions", icon: Send },
      { label: "Templates",   href: "/dashboard/templates",   icon: LayoutTemplate },
    ]
  },
  {
    category: "Customer",
    items: [
      { label: "Agents",    href: "/dashboard/agents",   icon: UserPlus, adminOnly: true },
      { label: "Settings",  href: "/dashboard/settings", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const isAdmin = user?.role === "Admin";
  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside
      className="flex flex-col w-[240px] min-h-screen flex-shrink-0 text-white"
      style={{ backgroundColor: DARK_NAVY }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-800/40">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: ACCENT }}>
          CRM.io
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-5 px-3 py-6 flex-1 overflow-y-auto">
        {NAV_CATEGORIES.map((cat) => {
          const filteredItems = cat.items.filter(item => !item.adminOnly || isAdmin);
          if (filteredItems.length === 0) return null;

          return (
            <div key={cat.category} className="flex flex-col gap-1.5">
              <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {cat.category}
              </span>

              {filteredItems.map(({ label, href, icon: Icon, exact }) => {
                const isActive = exact
                  ? pathname === href
                  : pathname === href || pathname.startsWith(href + "/");

                return (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all hover:text-white"
                    style={isActive
                      ? { backgroundColor: ACCENT, color: NAVY }
                      : { backgroundColor: "transparent", color: INACTIVE }
                    }
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      style={{ color: isActive ? NAVY : INACTIVE }}
                    />
                    <span className="text-sm font-bold">{label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User card */}
      <div className="mx-3 mb-4 mt-2 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
            style={{ backgroundColor: ACCENT, color: NAVY }}
          >
            {displayInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer"
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

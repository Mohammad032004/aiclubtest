"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext.jsx";
import { Icon } from "../../../components/Icons.jsx";
import ProtectedRoute from "../../../components/ProtectedRoute.jsx";

const mainNav = [
  { to: "/admin", label: "Overview", end: true, icon: Icon.overview },
  { to: "/admin/students", label: "Students", icon: Icon.students },
  { to: "/admin/questions", label: "Question Bank", icon: Icon.bank },
  { to: "/admin/tests", label: "Tests", icon: Icon.tests },
  { to: "/admin/results", label: "Results", icon: Icon.results },
  { to: "/admin/analytics", label: "Analytics", icon: Icon.analytics },
];
const manageNav = [
  { to: "/admin/categories", label: "Categories", icon: Icon.categories },
  { to: "/admin/settings", label: "Settings", icon: Icon.settings },
];

function isActivePath(pathname, item) {
  return item.end ? pathname === item.to : pathname.startsWith(item.to);
}

function NavList({ items, pathname, onNavigate }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isActivePath(pathname, item);
        return (
          <Link
            key={item.to}
            href={item.to}
            onClick={onNavigate}
            className={`focus-ring group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              active ? "bg-cyan-500/15 text-cyan-300" : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ pathname, onNavigate }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const initials = (user?.fullName || "A").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="h-full flex flex-col bg-navy-950 text-white">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-cyan-500 flex items-center justify-center font-extrabold text-navy-950 text-sm">AI</div>
          <div>
            <p className="font-extrabold text-[15px] leading-tight tracking-tight">AI CLUB</p>
            <p className="text-[11px] text-slate-400 leading-tight">Recruitment Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Main</p>
          <NavList items={mainNav} pathname={pathname} onNavigate={onNavigate} />
        </div>
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Management</p>
          <NavList items={manageNav} pathname={pathname} onNavigate={onNavigate} />
        </div>
      </div>

      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{user?.fullName || "Administrator"}</p>
          <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => { logout(); router.push("/admin/login"); }}
          title="Log out"
          className="focus-ring text-slate-400 hover:text-danger-500 hover:bg-white/5 p-2 rounded-lg transition"
        >
          <Icon.logout size={17} />
        </button>
      </div>
    </div>
  );
}

const allNav = [...mainNav, ...manageNav];

function AdminShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const current = allNav.find((n) => isActivePath(pathname, n));

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block sticky top-0 h-screen">
        <SidebarContent pathname={pathname} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            <SidebarContent pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-line px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-4">
          <button onClick={() => setDrawerOpen(true)} className="focus-ring lg:hidden text-ink-600 p-2 -ml-2 rounded-lg hover:bg-slate-100">
            <Icon.menu size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-900 truncate">{current?.label || "Admin"}</p>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AdminDashboardLayout({ children }) {
  return (
    <ProtectedRoute role="admin">
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}

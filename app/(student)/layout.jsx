"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useAuth } from "@/context/AuthContext.jsx";
import { Icon } from "@/components/Icons.jsx";
import ProtectedRoute from "@/components/ProtectedRoute.jsx";

const nav = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: Icon.overview,
    end: true,
  },
  {
    to: "/available-tests",
    label: "Available Tests",
    icon: Icon.tests,
  },
  {
    to: "/my-tests",
    label: "My Tests",
    icon: Icon.bank,
  },
  {
    to: "/my-results",
    label: "Results",
    icon: Icon.results,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: Icon.user,
  },
];

function isActivePath(pathname, item) {
  return item.end
    ? pathname === item.to
    : pathname.startsWith(item.to);
}

function StudentShell({ children }) {
  const { user, logout } = useAuth();

  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef = useRef(null);

  const initials = (
    user?.fullName || "Student"
  )
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  /* =====================================================
     CLOSE MENU WHEN CLICKING OUTSIDE
  ===================================================== */

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* =====================================================
     CLOSE MENU ON ROUTE CHANGE
  ===================================================== */

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* =====================================================
     LOGOUT
  ===================================================== */

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0">

      {/* =================================================
          ANIMATED GRADIENT STYLES
      ================================================= */}

      <style jsx>{`
        @keyframes movingGradient {
          0% {
            background-position: 0% 50%;
          }

          50% {
            background-position: 100% 50%;
          }

          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes gradientGlow {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }

          30% {
            opacity: 1;
          }

          70% {
            opacity: 1;
          }

          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .moving-gradient {
          background-size: 300% 300%;
          animation: movingGradient 6s ease infinite;
        }

        .gradient-shine {
          position: absolute;
          inset: 0;
          width: 45%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.18),
            transparent
          );
          transform: translateX(-100%);
          animation: gradientGlow 3.5s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* =================================================
          TOP NAVIGATION
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-white/5 bg-navy-950 text-white shadow-sm">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* =================================================
              AI CLUB BRAND
          ================================================= */}

          <Link
            href="/dashboard"
            className="focus-ring flex shrink-0 items-center gap-2.5 rounded-xl"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10 p-1.5">
              <img
                src="/ai-club-logo.png"
                alt="AI Club"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="hidden sm:block">
              <p className="text-[15px] font-extrabold leading-tight tracking-tight">
                AI CLUB
              </p>

              <p className="text-[10px] font-medium leading-tight text-slate-400">
                LPPGC • Recruitment Platform
              </p>
            </div>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav className="hidden items-center gap-1 lg:flex">

            {nav.map((item) => {
              const active =
                isActivePath(
                  pathname,
                  item
                );

              const IconCmp = item.icon;

              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`focus-ring group flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-cyan-500/15 text-cyan-300 shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <IconCmp
                    size={16}
                    className={
                      active
                        ? "text-cyan-400"
                        : "text-slate-400 group-hover:text-slate-200"
                    }
                  />

                  {item.label}
                </Link>
              );
            })}

          </nav>

          {/* =================================================
              PROFILE MENU
          ================================================= */}

          <div
            ref={menuRef}
            className="relative"
          >

            {/* PROFILE BUTTON */}

            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  (value) => !value
                )
              }
              aria-label="Open profile menu"
              aria-expanded={menuOpen}
              className={`focus-ring relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border text-xs font-extrabold transition-all ${
                menuOpen
                  ? "border-cyan-300/50 bg-cyan-400/20 text-cyan-200"
                  : "border-white/10 bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              {initials}
            </button>

            {/* =================================================
                DROPDOWN
            ================================================= */}

            {menuOpen && (
              <div
                className="
                  absolute right-0 mt-3 w-[280px]
                  overflow-hidden rounded-2xl
                  border border-slate-200/80
                  bg-white/95
                  shadow-[0_20px_60px_rgba(15,23,42,0.18)]
                  backdrop-blur-xl
                "
              >

                {/* =================================================
                    TOP USER SECTION
                ================================================= */}

                <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-4">

                  {/* Animated top line */}

                  <div
                    className="
                      absolute left-0 right-0 top-0 h-[3px]
                      moving-gradient
                    "
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #06b6d4, #2563eb, #7c3aed, #06b6d4)",
                    }}
                  />

                  <div className="flex items-center gap-3">

                    {/* Avatar */}

                    <div
                      className="
                        moving-gradient
                        flex h-12 w-12 shrink-0
                        items-center justify-center
                        rounded-full
                        text-sm font-extrabold
                        text-white
                        shadow-lg
                      "
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, #020617, #0891b2, #4f46e5, #020617)",
                      }}
                    >
                      {initials}
                    </div>

                    {/* User information */}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {user?.fullName ||
                          "Student"}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {user?.email ||
                          "Student account"}
                      </p>
                    </div>
                  </div>

                  {/* Course + Year */}

                  {(user?.course ||
                    user?.year) && (
                    <div className="mt-3 flex flex-wrap gap-2">

                      {user?.course && (
                        <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[10px] font-bold text-cyan-700">
                          {user.course}
                        </span>
                      )}

                      {user?.year && (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                          Year {user.year}
                        </span>
                      )}

                    </div>
                  )}

                </div>

                {/* =================================================
                    MENU ITEMS
                ================================================= */}

                <div className="p-2">

                  {/* =================================================
                      MY PROFILE
                  ================================================= */}

                  <Link
                    href="/profile"
                    className="
                      group relative
                      mb-1.5 flex
                      items-center gap-3
                      overflow-hidden
                      rounded-xl
                      px-3 py-3
                      text-sm font-semibold
                      text-white
                      shadow-sm
                      transition-all duration-300
                      hover:scale-[1.015]
                      hover:shadow-lg
                    "
                    style={{
                      backgroundImage:
                        "linear-gradient(110deg, #020617, #0f172a, #155e75, #2563eb, #4f46e5, #020617)",
                      backgroundSize: "300% 300%",
                      animation:
                        "movingGradient 7s ease infinite",
                    }}
                  >

                    {/* Shine */}

                    <span className="gradient-shine" />

                    {/* Icon */}

                    <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">

                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21a8 8 0 0 0-16 0" />

                        <circle
                          cx="12"
                          cy="7"
                          r="4"
                        />
                      </svg>

                    </span>

                    <span className="relative z-10">
                      My Profile
                    </span>

                    {/* Arrow */}

                    <span className="relative z-10 ml-auto text-white/50 transition-transform group-hover:translate-x-1 group-hover:text-white">
                      →
                    </span>

                  </Link>

                  {/* =================================================
                      MY RESULTS
                  ================================================= */}

                  <Link
                    href="/my-results"
                    className="
                      group relative
                      flex
                      items-center gap-3
                      overflow-hidden
                      rounded-xl
                      px-3 py-3
                      text-sm font-semibold
                      text-white
                      shadow-sm
                      transition-all duration-300
                      hover:scale-[1.015]
                      hover:shadow-lg
                    "
                    style={{
                      backgroundImage:
                        "linear-gradient(110deg, #020617, #172554, #3730a3, #0891b2, #2563eb, #020617)",
                      backgroundSize: "300% 300%",
                      animation:
                        "movingGradient 7s ease infinite",
                      animationDelay:
                        "-2.5s",
                    }}
                  >

                    {/* Shine */}

                    <span className="gradient-shine" />

                    {/* Icon */}

                    <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">

                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 3v18h18" />

                        <path d="M7 16l4-5 3 3 5-7" />
                      </svg>

                    </span>

                    <span className="relative z-10">
                      My Results
                    </span>

                    {/* Arrow */}

                    <span className="relative z-10 ml-auto text-white/50 transition-transform group-hover:translate-x-1 group-hover:text-white">
                      →
                    </span>

                  </Link>

                </div>

                {/* =================================================
                    LOGOUT
                ================================================= */}

                <div className="border-t border-slate-200 p-2">

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      group flex w-full
                      items-center gap-3
                      rounded-xl
                      px-3 py-3
                      text-sm font-semibold
                      text-red-600
                      transition-all
                      hover:bg-red-50
                    "
                  >

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition group-hover:bg-red-100">

                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

                        <polyline points="16 17 21 12 16 7" />

                        <line
                          x1="21"
                          y1="12"
                          x2="9"
                          y2="12"
                        />
                      </svg>

                    </span>

                    <span>
                      Log out
                    </span>

                  </button>

                </div>

              </div>
            )}

          </div>
        </div>
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {children}

        {/* =================================================
            DEVELOPER CREDIT
        ================================================= */}

        <footer className="mt-10 border-t border-line pt-5 pb-3 text-center">
          <p className="text-xs text-ink-400">
            Developed by{" "}
            <span className="font-semibold text-ink-700">
              Irfan Ansari
            </span>
          </p>
        </footer>

      </main>

      {/* =================================================
          MOBILE BOTTOM NAVIGATION
      ================================================= */}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">

        <div className="mx-auto flex max-w-lg items-stretch">

          {nav.map((item) => {
            const active =
              isActivePath(
                pathname,
                item
              );

            const IconCmp = item.icon;

            let mobileLabel =
              item.label;

            if (
              item.label ===
              "Available Tests"
            ) {
              mobileLabel = "Tests";
            }

            if (
              item.label ===
              "My Tests"
            ) {
              mobileLabel = "My Tests";
            }

            return (
              <Link
                key={item.to}
                href={item.to}
                className={`focus-ring relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition ${
                  active
                    ? "text-cyan-600"
                    : "text-ink-400 hover:text-ink-700"
                }`}
              >

                {active && (
                  <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-cyan-500" />
                )}

                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                    active
                      ? "bg-cyan-50"
                      : "bg-transparent"
                  }`}
                >
                  <IconCmp size={18} />
                </span>

                <span>
                  {mobileLabel}
                </span>

              </Link>
            );
          })}

        </div>

      </nav>

    </div>
  );
}

/* =========================================================
   PROTECTED STUDENT LAYOUT
========================================================= */

export default function StudentLayoutGroup({
  children,
}) {
  return (
    <ProtectedRoute role="student">
      <StudentShell>
        {children}
      </StudentShell>
    </ProtectedRoute>
  );
}
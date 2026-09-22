"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext.jsx";
import { Icon } from "./Icons.jsx";

export default function LoginForm({ variant = "student" }) {
  const isAdmin = variant === "admin";

  const { loginAdmin, loginStudent } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      if (isAdmin) {
        await loginAdmin(identifier, password);
        router.push("/admin");
      } else {
        await loginStudent(identifier, password);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-sm">
            <img
              src="/ai-club-logo.png"
              alt="AI Club"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">
            {isAdmin ? "Administrator Access" : "Student Access"}
          </p>

          <h1 className="mt-2 text-2xl font-extrabold text-ink-900">
            {isAdmin ? "Admin Login" : "Sign in to your test"}
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >

          {/* Username / Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">
              Username or Email
            </label>

            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter username or email"
              className="input w-full"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="input w-full pr-10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                <Icon.eye size={17} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Login */}
          <button
            type="submit"
            disabled={busy}
            className="btn-accent w-full py-3"
          >
            {busy ? "Signing in..." : "Login"}
          </button>

        </form>

        {/* Only admin gets student login link */}
        {isAdmin && (
          <p className="mt-5 text-center text-xs text-ink-400">
            Not an administrator?{" "}
            <a
              href="/login"
              className="font-semibold text-cyan-600 hover:underline"
            >
              Student login
            </a>
          </p>
        )}

      </div>
    </div>
  );
}
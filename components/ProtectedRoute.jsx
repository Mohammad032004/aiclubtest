"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext.jsx";

// Client-side route guard. Next.js serves the page shell for any URL
// (including on refresh/direct navigation — file-based routing handles
// that natively), then this checks the auth state stored in localStorage
// once mounted and redirects if it doesn't match the required role.
export default function ProtectedRoute({ role, children }) {
  const { user, role: currentRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || currentRole !== role) {
      router.replace(role === "admin" ? "/admin/login" : "/login");
    }
  }, [loading, user, currentRole, role, router]);

  if (loading) return null;
  if (!user || currentRole !== role) return null;
  return children;
}

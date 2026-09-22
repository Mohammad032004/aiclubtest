"use client";

import React from "react";
import { AuthProvider } from "../context/AuthContext.jsx";
import { ToastProvider } from "../context/ToastContext.jsx";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}

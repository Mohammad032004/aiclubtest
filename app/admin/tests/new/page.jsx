"use client";

import ProtectedRoute from "@/components/ProtectedRoute.jsx";
import TestBuilder from "@/components/admin/TestBuilder.jsx";

export default function NewTestPage() {
  return (
    <ProtectedRoute role="admin">
      <div className="min-h-screen bg-surface p-4 sm:p-8">
        <TestBuilder />
      </div>
    </ProtectedRoute>
  );
}

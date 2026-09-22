import { redirect } from "next/navigation";

// Root route: mirrors the old SPA's `<Navigate to="/login" replace />` default.
export default function RootPage() {
  redirect("/login");
}

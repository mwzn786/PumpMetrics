"use client";

import { useAuth } from "@/context/AuthContext";
import { canAccessRoute } from "@/lib/permissions";
import { usePathname } from "next/navigation";
import AccessDenied from "./AccessDenied";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const pathname = usePathname();

  if (pathname === "/access-denied") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (role && !canAccessRoute(pathname, role)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

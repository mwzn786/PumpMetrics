"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { StationProvider } from "@/context/StationContext";
import AuthGate from "./AuthGate";
import Sidebar, { MobileNav } from "./Sidebar";
import { MobileHeader, TopBar } from "./TopBar";
import RoleGuard from "./RoleGuard";

function CashierRedirect() {
  const { role, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role === "cashier" && pathname === "/") {
      router.replace("/readings");
    }
  }, [role, loading, pathname, router]);

  return null;
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthGate>
      <div
        className={`dashboard-wrapper${collapsed ? " sidebar-is-collapsed" : ""}`}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
        />
        <div className="dashboard-main">
          <MobileHeader />
          <TopBar />
          <main className="dashboard-content">
            <CashierRedirect />
            <RoleGuard>{children}</RoleGuard>
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGate>
  );
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthProvider>
        <StationProvider>
          <DashboardInner>{children}</DashboardInner>
        </StationProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

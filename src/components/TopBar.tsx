"use client";

import StationSelector, { UserMenu } from "./StationSelector";
import { useAuth } from "@/context/AuthContext";

export function TopBar() {
  const { isCashier } = useAuth();

  return (
    <header className="top-bar d-flex align-items-center justify-content-between px-3 py-2 bg-white border-bottom gap-2">
      <div className="d-none d-lg-block flex-shrink-0">
        {!isCashier && (
          <small className="text-muted text-uppercase fw-semibold">
            Active Station
          </small>
        )}
      </div>
      <div className="d-flex align-items-center gap-2 ms-auto flex-wrap justify-content-end">
        <StationSelector />
        <UserMenu />
      </div>
    </header>
  );
}

export function MobileHeader() {
  return (
    <header className="mobile-header d-lg-none d-flex align-items-center justify-content-between px-3 py-2 gap-2">
      <span className="fw-bold text-primary fs-6 text-truncate">
        <i className="bi bi-fuel-pump-fill me-1" />
        PumpMetrics
      </span>
      <UserMenu />
    </header>
  );
}

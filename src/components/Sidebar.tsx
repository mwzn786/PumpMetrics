"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getNavItemsForRole } from "@/lib/permissions";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useAuth();
  const navItems = getNavItemsForRole(role);

  return (
    <aside
      className={`sidebar d-none d-lg-flex flex-column ${collapsed ? "sidebar-collapsed" : ""}`}
    >
      <div className="sidebar-header d-flex align-items-center justify-content-between px-3 py-3">
        {!collapsed && (
          <span className="fw-bold text-white fs-5">
            <i className="bi bi-fuel-pump-fill me-2" />
            PumpMetrics
          </span>
        )}
        <button
          type="button"
          className="btn btn-sm btn-outline-light border-0"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`} />
        </button>
      </div>

      <nav className="sidebar-nav flex-grow-1 px-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${active ? "active" : ""}`}
              title={item.label}
            >
              <i className={`bi ${item.icon}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  const navItems = getNavItemsForRole(role);

  return (
    <nav className="mobile-nav d-lg-none">
      {navItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-link ${active ? "active" : ""}`}
          >
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

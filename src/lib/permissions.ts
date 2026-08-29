import type { UserRole } from "./types";

export const ROLES: Record<UserRole, { label: string; icon: string; description: string }> = {
  super_admin: {
    label: "Super Admin",
    icon: "👑",
    description: "Full power — manage everything",
  },
  station_manager: {
    label: "Station Manager",
    icon: "🏢",
    description: "Control over one assigned site",
  },
  cashier: {
    label: "Cashier",
    icon: "📝",
    description: "Shift logs only",
  },
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles: UserRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "bi-speedometer2", roles: ["super_admin", "station_manager"] },
  { href: "/stations", label: "Stations", icon: "bi-geo-alt", roles: ["super_admin"] },
  { href: "/pumps", label: "Pumps", icon: "bi-fuel-pump", roles: ["super_admin", "station_manager"] },
  { href: "/readings", label: "Readings", icon: "bi-journal-text", roles: ["super_admin", "station_manager", "cashier"] },
  { href: "/reports", label: "Reports", icon: "bi-bar-chart-line", roles: ["super_admin", "station_manager"] },
  { href: "/users", label: "Users", icon: "bi-people", roles: ["super_admin"] },
];

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/": ["super_admin", "station_manager"],
  "/stations": ["super_admin"],
  "/pumps": ["super_admin", "station_manager"],
  "/readings": ["super_admin", "station_manager", "cashier"],
  "/reports": ["super_admin", "station_manager"],
  "/users": ["super_admin"],
};

export function getNavItemsForRole(role: UserRole | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function getDefaultRoute(role: UserRole | null): string {
  if (role === "cashier") return "/readings";
  return "/";
}

export function canAccessRoute(pathname: string, role: UserRole | null): boolean {
  if (!role) return false;

  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";
  const match = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
    route === "/" ? normalized === "/" : normalized.startsWith(route),
  );

  if (!match) return true;
  return match[1].includes(role);
}

export function isStationLocked(role: UserRole | null): boolean {
  return role === "station_manager" || role === "cashier";
}

export function canManageUsers(role: UserRole | null): boolean {
  return role === "super_admin";
}

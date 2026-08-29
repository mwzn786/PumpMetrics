"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getDefaultRoute } from "@/lib/permissions";
import type { UserProfile, UserRole } from "@/lib/types";

type AuthContextValue = {
  user: { id: number; email: string; name: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  role: UserRole | null;
  isSuperAdmin: boolean;
  isStationManager: boolean;
  isCashier: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === "loading";

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }, [router]);

  const role = session?.user?.role ?? null;
  const userId = session?.user?.id
    ? parseInt(session.user.id, 10)
    : null;

  const profile: UserProfile | null = session?.user
    ? {
        id: userId ?? 0,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role,
        station_id: session.user.stationId,
        created_at: "",
      }
    : null;

  const user = session?.user
    ? {
        id: userId ?? 0,
        email: session.user.email ?? "",
        name: session.user.name ?? "",
      }
    : null;

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signOut: handleSignOut,
      role,
      isSuperAdmin: role === "super_admin",
      isStationManager: role === "station_manager",
      isCashier: role === "cashier",
    }),
    [user, profile, loading, handleSignOut, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { getDefaultRoute };

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import type { UserRole } from "@/lib/types";

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  stationId: number | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return {
    id: parseInt(session.user.id, 10),
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
    stationId: session.user.stationId,
  };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { error: unauthorized() } as const;
  return { user } as const;
}

export async function requireSuperAdmin() {
  const result = await requireUser();
  if ("error" in result) return result;
  if (result.user.role !== "super_admin") {
    return { error: forbidden() } as const;
  }
  return result;
}

export function resolveStationId(
  user: SessionUser,
  requestedStationId: number | null,
): number | null {
  if (user.role === "super_admin") return requestedStationId;
  return user.stationId;
}

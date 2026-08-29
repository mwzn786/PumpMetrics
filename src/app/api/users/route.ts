import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/serialize";
import type { UserRole } from "@/lib/types";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { station: { select: { name: true, location: true } } },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      station_id: u.stationId,
      created_at: iso(u.createdAt),
      stations: u.station
        ? { name: u.station.name, location: u.station.location }
        : null,
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { name, email, role, station_id, password } = body as {
    name: string;
    email: string;
    role: UserRole;
    station_id?: number | null;
    password: string;
  };

  if (!name?.trim() || !email?.trim() || !role || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  if (role !== "super_admin" && !station_id) {
    return NextResponse.json(
      { error: "Station is required for this role" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      stationId: role === "super_admin" ? null : station_id,
    },
    include: { station: { select: { name: true, location: true } } },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    station_id: user.stationId,
    created_at: iso(user.createdAt),
    stations: user.station
      ? { name: user.station.name, location: user.station.location }
      : null,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return auth.error;

  const id = parseInt(new URL(request.url).searchParams.get("id") ?? "", 10);
  if (!id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  if (id === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

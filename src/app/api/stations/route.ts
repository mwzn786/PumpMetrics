import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { dateStr, iso } from "@/lib/serialize";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const stations = await prisma.station.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { pumps: true } } },
  });

  return NextResponse.json(
    stations.map((s) => ({
      id: s.id,
      name: s.name,
      location: s.location,
      phone: s.phone,
      manager_name: s.managerName,
      created_at: iso(s.createdAt),
      pumpCount: s._count.pumps,
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  if (auth.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const station = await prisma.station.create({
    data: {
      name: body.name?.trim(),
      location: body.location?.trim() || null,
      phone: body.phone?.trim() || null,
      managerName: body.manager_name?.trim() || null,
    },
    include: { _count: { select: { pumps: true } } },
  });

  return NextResponse.json({
    id: station.id,
    name: station.name,
    location: station.location,
    phone: station.phone,
    manager_name: station.managerName,
    created_at: iso(station.createdAt),
    pumpCount: station._count.pumps,
  });
}

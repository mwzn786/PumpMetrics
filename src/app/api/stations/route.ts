import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/serialize";

function serializeStation(s: {
  id: number;
  name: string;
  stationCode: string | null;
  location: string | null;
  phone: string | null;
  managerName: string | null;
  createdAt: Date;
  _count: { pumps: number };
}) {
  return {
    id: s.id,
    name: s.name,
    station_code: s.stationCode,
    location: s.location,
    phone: s.phone,
    manager_name: s.managerName,
    created_at: iso(s.createdAt),
    pumpCount: s._count.pumps,
  };
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const stations = await prisma.station.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { pumps: true } } },
  });

  return NextResponse.json(stations.map(serializeStation));
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
      stationCode: body.station_code?.trim() || null,
      location: body.location?.trim() || null,
      phone: body.phone?.trim() || null,
      managerName: body.manager_name?.trim() || null,
    },
    include: { _count: { select: { pumps: true } } },
  });

  return NextResponse.json(serializeStation(station));
}

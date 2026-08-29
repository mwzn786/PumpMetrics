import { NextResponse } from "next/server";
import { requireUser, resolveStationId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/serialize";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const stationId = resolveStationId(
    auth.user,
    parseInt(new URL(request.url).searchParams.get("stationId") ?? "", 10) ||
      null,
  );

  if (!stationId) {
    return NextResponse.json([]);
  }

  const pumps = await prisma.pump.findMany({
    where: { stationId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    pumps.map((p) => ({
      id: p.id,
      name: p.name,
      fuel_type: p.fuelType,
      station_id: p.stationId,
      created_at: iso(p.createdAt),
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const stationId = resolveStationId(auth.user, body.station_id);

  if (!stationId) {
    return NextResponse.json({ error: "Station required" }, { status: 400 });
  }

  if (
    auth.user.role === "cashier" ||
    (auth.user.role === "station_manager" &&
      auth.user.stationId !== stationId)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pump = await prisma.pump.create({
    data: {
      name: body.name?.trim(),
      fuelType: body.fuel_type,
      stationId,
    },
  });

  return NextResponse.json({
    id: pump.id,
    name: pump.name,
    fuel_type: pump.fuelType,
    station_id: pump.stationId,
    created_at: iso(pump.createdAt),
  });
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const id = parseInt(new URL(request.url).searchParams.get("id") ?? "", 10);
  if (!id) {
    return NextResponse.json({ error: "Missing pump id" }, { status: 400 });
  }

  const pump = await prisma.pump.findUnique({ where: { id } });
  if (!pump) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    auth.user.role === "cashier" ||
    (auth.user.role !== "super_admin" &&
      pump.stationId !== auth.user.stationId)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.pump.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { requireUser, resolveStationId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { dec, iso } from "@/lib/serialize";
import { buildUnitDisplayName } from "@/lib/utils";

function serializePump(p: {
  id: number;
  name: string;
  unitNumber: string | null;
  nozzleNumber: string | null;
  fuelType: string;
  stationId: number | null;
  tankId: number | null;
  createdAt: Date;
  tank?: {
    id: number;
    code: string;
    name: string;
    fuelType: string;
    color: string;
    currentStock: { toString(): string } | number;
  } | null;
}) {
  return {
    id: p.id,
    name: p.name,
    unit_number: p.unitNumber,
    nozzle_number: p.nozzleNumber,
    fuel_type: p.fuelType,
    station_id: p.stationId,
    tank_id: p.tankId,
    created_at: iso(p.createdAt),
    tank: p.tank
      ? {
          id: p.tank.id,
          code: p.tank.code,
          name: p.tank.name,
          fuel_type: p.tank.fuelType,
          color: p.tank.color,
          current_stock: dec(p.tank.currentStock as never),
        }
      : null,
  };
}

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
    include: { tank: true },
    orderBy: [{ unitNumber: "asc" }, { nozzleNumber: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(pumps.map(serializePump));
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

  const unitNumber = String(body.unit_number ?? "").trim();
  const nozzleNumber = String(body.nozzle_number ?? "").trim();
  const tankId = parseInt(body.tank_id, 10);

  if (!unitNumber || !nozzleNumber) {
    return NextResponse.json(
      { error: "Unit number and nozzle number are required" },
      { status: 400 },
    );
  }

  if (!tankId) {
    return NextResponse.json(
      { error: "Supply tank is required" },
      { status: 400 },
    );
  }

  const tank = await prisma.tank.findUnique({ where: { id: tankId } });
  if (!tank || tank.stationId !== stationId) {
    return NextResponse.json(
      { error: "Tank not found at this station" },
      { status: 400 },
    );
  }

  const pump = await prisma.pump.create({
    data: {
      name: buildUnitDisplayName(unitNumber, nozzleNumber),
      unitNumber,
      nozzleNumber,
      fuelType: tank.fuelType,
      stationId,
      tankId: tank.id,
    },
    include: { tank: true },
  });

  return NextResponse.json(serializePump(pump));
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const id = parseInt(new URL(request.url).searchParams.get("id") ?? "", 10);
  if (!id) {
    return NextResponse.json({ error: "Missing unit id" }, { status: 400 });
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

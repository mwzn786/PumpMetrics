import { NextResponse } from "next/server";
import { requireUser, resolveStationId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { dec, iso } from "@/lib/serialize";

function serializeTank(t: {
  id: number;
  code: string;
  name: string;
  fuelType: string;
  color: string;
  maxCapacity: { toString(): string } | number;
  currentStock: { toString(): string } | number;
  stationId: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: t.id,
    code: t.code,
    name: t.name,
    fuel_type: t.fuelType,
    color: t.color,
    max_capacity: dec(t.maxCapacity as never),
    current_stock: dec(t.currentStock as never),
    station_id: t.stationId,
    created_at: iso(t.createdAt),
    updated_at: iso(t.updatedAt),
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

  const tanks = await prisma.tank.findMany({
    where: { stationId },
    orderBy: [{ code: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(tanks.map(serializeTank));
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

  const code = String(body.code ?? "").trim();
  const name = String(body.name ?? "").trim();
  const fuelType = String(body.fuel_type ?? "").trim();
  const color = String(body.color ?? "#0d6efd").trim() || "#0d6efd";
  const maxCapacity = parseFloat(body.max_capacity);
  const currentStockRaw = body.current_stock;
  const currentStock =
    currentStockRaw === "" || currentStockRaw == null
      ? 0
      : parseFloat(currentStockRaw);

  if (!code || !name || !fuelType) {
    return NextResponse.json(
      { error: "Code, name, and fuel type are required" },
      { status: 400 },
    );
  }

  if (isNaN(maxCapacity) || maxCapacity <= 0) {
    return NextResponse.json(
      { error: "Maximum capacity must be a positive number" },
      { status: 400 },
    );
  }

  if (isNaN(currentStock) || currentStock < 0) {
    return NextResponse.json(
      { error: "Current stock must be zero or greater" },
      { status: 400 },
    );
  }

  if (currentStock > maxCapacity) {
    return NextResponse.json(
      { error: "Current stock cannot exceed maximum capacity" },
      { status: 400 },
    );
  }

  const tank = await prisma.tank.create({
    data: {
      code,
      name,
      fuelType,
      color,
      maxCapacity,
      currentStock,
      stationId,
    },
  });

  return NextResponse.json(serializeTank(tank));
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const id = parseInt(new URL(request.url).searchParams.get("id") ?? "", 10);
  if (!id) {
    return NextResponse.json({ error: "Missing tank id" }, { status: 400 });
  }

  const tank = await prisma.tank.findUnique({ where: { id } });
  if (!tank) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    auth.user.role === "cashier" ||
    (auth.user.role !== "super_admin" &&
      tank.stationId !== auth.user.stationId)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.tank.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

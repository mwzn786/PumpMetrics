import { NextResponse } from "next/server";
import { requireUser, resolveStationId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { dec, dateStr, iso } from "@/lib/serialize";
import { todayString } from "@/lib/utils";

function serializePump(p: {
  id: number;
  name: string;
  unitNumber: string | null;
  nozzleNumber: string | null;
  fuelType: string;
  stationId: number | null;
  createdAt: Date;
}) {
  return {
    id: p.id,
    name: p.name,
    unit_number: p.unitNumber,
    nozzle_number: p.nozzleNumber,
    fuel_type: p.fuelType,
    station_id: p.stationId,
    created_at: iso(p.createdAt),
  };
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const params = new URL(request.url).searchParams;
  const stationId = resolveStationId(
    auth.user,
    parseInt(params.get("stationId") ?? "", 10) || null,
  );
  const date = params.get("date") ?? todayString();

  if (!stationId) {
    return NextResponse.json([]);
  }

  const readings = await prisma.dailyReading.findMany({
    where: {
      readingDate: new Date(date),
      pump: { stationId },
    },
    include: { pump: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    readings.map((r) => ({
      id: r.id,
      pump_id: r.pumpId,
      reading_date: dateStr(r.readingDate),
      start_reading: dec(r.startReading),
      end_reading: dec(r.endReading),
      liters_sold: dec(r.litersSold),
      price: r.price != null ? dec(r.price) : null,
      created_at: iso(r.createdAt),
      pumps: serializePump(r.pump),
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const pumpId = parseInt(body.pump_id, 10);
  const start = parseFloat(body.start_reading);
  const end = parseFloat(body.end_reading);
  const priceRaw = body.price;
  const price =
    priceRaw === "" || priceRaw == null ? null : parseFloat(priceRaw);

  const pump = await prisma.pump.findUnique({ where: { id: pumpId } });
  if (!pump) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  if (
    auth.user.role !== "super_admin" &&
    pump.stationId !== auth.user.stationId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (end <= start) {
    return NextResponse.json(
      { error: "End reading must be greater than start reading" },
      { status: 400 },
    );
  }

  if (price != null && (isNaN(price) || price < 0)) {
    return NextResponse.json(
      { error: "Price must be a non-negative number" },
      { status: 400 },
    );
  }

  const readingDate = body.reading_date || todayString();

  const reading = await prisma.dailyReading.create({
    data: {
      pumpId,
      readingDate: new Date(readingDate),
      startReading: start,
      endReading: end,
      litersSold: end - start,
      price,
    },
    include: { pump: true },
  });

  return NextResponse.json({
    id: reading.id,
    pump_id: reading.pumpId,
    reading_date: dateStr(reading.readingDate),
    start_reading: dec(reading.startReading),
    end_reading: dec(reading.endReading),
    liters_sold: dec(reading.litersSold),
    price: reading.price != null ? dec(reading.price) : null,
    created_at: iso(reading.createdAt),
    pumps: serializePump(reading.pump),
  });
}

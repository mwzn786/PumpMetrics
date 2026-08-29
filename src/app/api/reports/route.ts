import { NextResponse } from "next/server";
import { requireUser, resolveStationId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { dec, dateStr, iso } from "@/lib/serialize";
import type { TimeFilter } from "@/lib/types";
import { getDateRange, todayString } from "@/lib/utils";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const params = new URL(request.url).searchParams;
  const filter = (params.get("filter") ?? "day") as TimeFilter;
  const stationId = resolveStationId(
    auth.user,
    parseInt(params.get("stationId") ?? "", 10) || null,
  );
  const { start, end } = getDateRange(filter);
  const startDate = new Date(start);
  const endDate = new Date(end);

  const [stations, allReadings, allStoreSales] = await Promise.all([
    prisma.station.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { pumps: true } } },
    }),
    prisma.dailyReading.findMany({
      where: {
        readingDate: { gte: startDate, lte: endDate },
      },
      include: { pump: true },
    }),
    prisma.storeSale.findMany({
      where: {
        saleDate: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const fuelByStation: Record<number, number> = {};
  allReadings.forEach((r) => {
    const sid = r.pump.stationId;
    if (sid) {
      fuelByStation[sid] = (fuelByStation[sid] ?? 0) + dec(r.litersSold);
    }
  });

  const revenueByStation: Record<number, number> = {};
  allStoreSales.forEach((s) => {
    if (s.stationId) {
      revenueByStation[s.stationId] =
        (revenueByStation[s.stationId] ?? 0) + dec(s.totalRevenue);
    }
  });

  const executiveSummary = stations.map((s) => ({
    stationId: s.id,
    stationName: s.name,
    location: s.location,
    phone: s.phone,
    managerName: s.managerName,
    pumpCount: s._count.pumps,
    fuelLiters: fuelByStation[s.id] ?? 0,
    storeRevenue: revenueByStation[s.id] ?? 0,
  }));

  let stationData = null;
  if (stationId) {
    const stationReadings = allReadings.filter(
      (r) => r.pump.stationId === stationId,
    );
    const pumpMap = new Map<
      number,
      { pumpName: string; fuelType: string; totalLiters: number }
    >();
    const trendMap = new Map<string, number>();

    stationReadings.forEach((r) => {
      const existing = pumpMap.get(r.pumpId);
      const liters = dec(r.litersSold);
      if (existing) {
        existing.totalLiters += liters;
      } else {
        pumpMap.set(r.pumpId, {
          pumpName: r.pump.name,
          fuelType: r.pump.fuelType,
          totalLiters: liters,
        });
      }
      const d = dateStr(r.readingDate);
      trendMap.set(d, (trendMap.get(d) ?? 0) + liters);
    });

    const [inventory, storeSales, drilldownReadings] = await Promise.all([
      prisma.fuelInventory.findMany({
        where: { stationId },
        orderBy: { fuelType: "asc" },
      }),
      prisma.storeSale.findMany({
        where: {
          stationId,
          saleDate: { gte: startDate, lte: endDate },
        },
        orderBy: { saleDate: "desc" },
      }),
      prisma.dailyReading.findMany({
        where: {
          readingDate: { gte: startDate, lte: endDate },
          pump: { stationId },
        },
        include: { pump: true },
        orderBy: { readingDate: "desc" },
      }),
    ]);

    stationData = {
      fuelReport: Array.from(pumpMap.values()),
      totalLiters: Array.from(pumpMap.values()).reduce(
        (s, r) => s + r.totalLiters,
        0,
      ),
      inventory: inventory.map((i) => ({
        id: i.id,
        fuel_type: i.fuelType,
        current_stock: dec(i.currentStock),
        station_id: i.stationId,
        last_delivery_date: i.lastDeliveryDate
          ? dateStr(i.lastDeliveryDate)
          : null,
        last_delivery_amount: i.lastDeliveryAmount
          ? dec(i.lastDeliveryAmount)
          : null,
        updated_at: iso(i.updatedAt),
      })),
      dailySalesTrend: Array.from(trendMap.entries())
        .map(([date, liters]) => ({ date, liters }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      stationReadings: drilldownReadings.map((r) => ({
        id: r.id,
        pump_id: r.pumpId,
        reading_date: dateStr(r.readingDate),
        start_reading: dec(r.startReading),
        end_reading: dec(r.endReading),
        liters_sold: dec(r.litersSold),
        created_at: iso(r.createdAt),
        pumps: {
          name: r.pump.name,
          fuel_type: r.pump.fuelType,
        },
      })),
      storeSales: storeSales.map((s) => ({
        id: s.id,
        sale_date: dateStr(s.saleDate),
        cash_revenue: dec(s.cashRevenue),
        card_revenue: dec(s.cardRevenue),
        total_revenue: dec(s.totalRevenue),
        station_id: s.stationId,
        created_at: iso(s.createdAt),
      })),
      cashTotal: storeSales.reduce((s, r) => s + dec(r.cashRevenue), 0),
      cardTotal: storeSales.reduce((s, r) => s + dec(r.cardRevenue), 0),
    };
  }

  return NextResponse.json({ executiveSummary, stationData });
}

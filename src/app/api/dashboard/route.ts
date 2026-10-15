import { NextResponse } from "next/server";
import { requireUser, resolveStationId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { dec, dateStr, iso } from "@/lib/serialize";
import { getLast7Days, todayString } from "@/lib/utils";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const stationId = resolveStationId(
    auth.user,
    parseInt(new URL(request.url).searchParams.get("stationId") ?? "", 10) ||
      null,
  );

  if (!stationId) {
    return NextResponse.json({
      fuelSoldToday: 0,
      storeIncomeToday: 0,
      tanks: [],
      weeklyLabels: getLast7Days(),
      weeklyData: getLast7Days().map(() => 0),
      mixLabels: [],
      mixData: [],
    });
  }

  const today = todayString();
  const last7 = getLast7Days();

  const [todayReadings, todaySales, tanks, weekReadings] = await Promise.all([
    prisma.dailyReading.findMany({
      where: {
        readingDate: new Date(today),
        pump: { stationId },
      },
    }),
    prisma.storeSale.findMany({
      where: {
        saleDate: new Date(today),
        stationId,
      },
    }),
    prisma.tank.findMany({
      where: { stationId },
      orderBy: [{ code: "asc" }, { name: "asc" }],
    }),
    prisma.dailyReading.findMany({
      where: {
        readingDate: {
          gte: new Date(last7[0]),
          lte: new Date(last7[last7.length - 1]),
        },
        pump: { stationId },
      },
      include: { pump: true },
    }),
  ]);

  const fuelSoldToday = todayReadings.reduce(
    (sum, r) => sum + dec(r.litersSold),
    0,
  );
  const storeIncomeToday = todaySales.reduce(
    (sum, s) => sum + dec(s.totalRevenue),
    0,
  );

  const dailyTotals = last7.map((date) =>
    weekReadings
      .filter((r) => dateStr(r.readingDate) === date)
      .reduce((sum, r) => sum + dec(r.litersSold), 0),
  );

  const fuelMix: Record<string, number> = {};
  weekReadings.forEach((r) => {
    const ft = r.pump.fuelType;
    fuelMix[ft] = (fuelMix[ft] ?? 0) + dec(r.litersSold);
  });

  return NextResponse.json({
    fuelSoldToday,
    storeIncomeToday,
    tanks: tanks.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      fuel_type: t.fuelType,
      color: t.color,
      max_capacity: dec(t.maxCapacity),
      current_stock: dec(t.currentStock),
      station_id: t.stationId,
      created_at: iso(t.createdAt),
      updated_at: iso(t.updatedAt),
    })),
    weeklyLabels: last7,
    weeklyData: dailyTotals,
    mixLabels: Object.keys(fuelMix),
    mixData: Object.values(fuelMix),
  });
}

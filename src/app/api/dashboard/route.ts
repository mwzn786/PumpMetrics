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
      inventory: [],
      weeklyLabels: getLast7Days(),
      weeklyData: getLast7Days().map(() => 0),
      mixLabels: [],
      mixData: [],
    });
  }

  const today = todayString();
  const last7 = getLast7Days();

  const [todayReadings, todaySales, inventory, weekReadings] = await Promise.all(
    [
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
      prisma.fuelInventory.findMany({
        where: { stationId },
        orderBy: { fuelType: "asc" },
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
    ],
  );

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
    weeklyLabels: last7,
    weeklyData: dailyTotals,
    mixLabels: Object.keys(fuelMix),
    mixData: Object.values(fuelMix),
  });
}

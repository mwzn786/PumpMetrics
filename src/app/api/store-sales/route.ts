import { NextResponse } from "next/server";
import { requireUser, resolveStationId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { dec, dateStr, iso } from "@/lib/serialize";
import { todayString } from "@/lib/utils";

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

  const cash = parseFloat(body.cash_revenue) || 0;
  const card = parseFloat(body.card_revenue) || 0;

  const sale = await prisma.storeSale.create({
    data: {
      saleDate: new Date(body.sale_date ?? todayString()),
      cashRevenue: cash,
      cardRevenue: card,
      totalRevenue: cash + card,
      stationId,
    },
  });

  return NextResponse.json({
    id: sale.id,
    sale_date: dateStr(sale.saleDate),
    cash_revenue: dec(sale.cashRevenue),
    card_revenue: dec(sale.cardRevenue),
    total_revenue: dec(sale.totalRevenue),
    station_id: sale.stationId,
    created_at: iso(sale.createdAt),
  });
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import KPICard from "@/components/KPICard";
import { FuelSalesChart, ProductMixChart } from "@/components/Charts";
import { useStation } from "@/context/StationContext";
import type { Tank } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { activeStationId, activeStation } = useStation();
  const [fuelSoldToday, setFuelSoldToday] = useState(0);
  const [storeIncomeToday, setStoreIncomeToday] = useState(0);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [weeklyLabels, setWeeklyLabels] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<number[]>([]);
  const [mixLabels, setMixLabels] = useState<string[]>([]);
  const [mixData, setMixData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!activeStationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch(`/api/dashboard?stationId=${activeStationId}`);
    if (!res.ok) {
      setError("Unable to load dashboard data. Check your database connection.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setFuelSoldToday(data.fuelSoldToday);
    setStoreIncomeToday(data.storeIncomeToday);
    setTanks(data.tanks ?? []);
    setWeeklyLabels(data.weeklyLabels);
    setWeeklyData(data.weeklyData);
    setMixLabels(data.mixLabels);
    setMixData(data.mixData);
    setLoading(false);
  }, [activeStationId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalStock = tanks.reduce(
    (sum, tank) => sum + Number(tank.current_stock),
    0,
  );

  if (!activeStationId) {
    return (
      <div>
        <div className="page-header">
          <h1 className="h3 fw-bold mb-1">Dashboard</h1>
        </div>
        <div className="alert alert-info">
          Select or create a station to view metrics.{" "}
          <Link href="/stations">Go to Filling Stations</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="h3 fw-bold mb-1">Dashboard</h1>
        <p className="text-muted mb-0">
          {activeStation?.name} — today&apos;s overview
        </p>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <KPICard
              title="Total Fuel Sold Today"
              value={`${formatNumber(fuelSoldToday)} L`}
              icon="bi-droplet-fill"
              variant="primary"
            />
            <KPICard
              title="Total Store Income"
              value={`$${formatNumber(storeIncomeToday)}`}
              icon="bi-cash-stack"
              variant="success"
            />
            <KPICard
              title="Current Tank Stock"
              value={`${formatNumber(totalStock)} L`}
              icon="bi-database-fill"
              variant="warning"
              subtitle={`${tanks.length} tank(s) tracked`}
            />
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-7">
              <div className="card chart-card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title fw-semibold mb-3">
                    Fuel Sales — Last 7 Days
                  </h5>
                  <FuelSalesChart labels={weeklyLabels} data={weeklyData} />
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <div className="card chart-card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title fw-semibold mb-3">
                    Product Mix (7 Days)
                  </h5>
                  {mixLabels.length > 0 ? (
                    <ProductMixChart labels={mixLabels} data={mixData} />
                  ) : (
                    <p className="text-muted text-center py-5 mb-0">
                      No sales data yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h5 className="card-title fw-semibold mb-0">Tank Stock</h5>
                <Link href="/tanks" className="btn btn-sm btn-outline-primary">
                  Manage Tanks
                </Link>
              </div>
              {tanks.length === 0 ? (
                <p className="text-muted mb-0">
                  No tanks yet.{" "}
                  <Link href="/tanks">Add a tank</Link> to track stock levels.
                </p>
              ) : (
                <div className="row g-3">
                  {tanks.map((tank) => {
                    const pct =
                      tank.max_capacity > 0
                        ? Math.min(
                            100,
                            (Number(tank.current_stock) /
                              Number(tank.max_capacity)) *
                              100,
                          )
                        : 0;
                    return (
                      <div key={tank.id} className="col-12 col-md-6 col-xl-4">
                        <div className="p-3 bg-light rounded h-100">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span
                              className="rounded-circle border"
                              style={{
                                width: 14,
                                height: 14,
                                backgroundColor: tank.color,
                                display: "inline-block",
                              }}
                            />
                            <span className="fw-medium">{tank.name}</span>
                            <span className="badge bg-secondary-subtle text-secondary-emphasis">
                              {tank.code}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted">{tank.fuel_type}</span>
                            <strong>
                              {formatNumber(Number(tank.current_stock))} /{" "}
                              {formatNumber(Number(tank.max_capacity))} L
                            </strong>
                          </div>
                          <div className="progress" style={{ height: 8 }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: tank.color,
                              }}
                              aria-valuenow={pct}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

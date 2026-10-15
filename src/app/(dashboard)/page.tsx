"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import KPICard from "@/components/KPICard";
import { FuelSalesChart, ProductMixChart } from "@/components/Charts";
import { useStation } from "@/context/StationContext";
import type { FuelInventory } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const { activeStationId, activeStation } = useStation();
  const [fuelSoldToday, setFuelSoldToday] = useState(0);
  const [storeIncomeToday, setStoreIncomeToday] = useState(0);
  const [inventory, setInventory] = useState<FuelInventory[]>([]);
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
    setInventory(data.inventory);
    setWeeklyLabels(data.weeklyLabels);
    setWeeklyData(data.weeklyData);
    setMixLabels(data.mixLabels);
    setMixData(data.mixData);
    setLoading(false);
  }, [activeStationId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const totalStock = inventory.reduce(
    (sum, item) => sum + Number(item.current_stock),
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
              title="Current Fuel Stock"
              value={`${formatNumber(totalStock)} L`}
              icon="bi-database-fill"
              variant="warning"
              subtitle={`${inventory.length} fuel type(s) tracked`}
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

          {inventory.length > 0 && (
            <div className="card border-0 shadow-sm mt-4">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">Tank Levels</h5>
                <div className="row g-3">
                  {inventory.map((item) => (
                    <div key={item.id} className="col-12 col-md-4">
                      <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                        <span className="fw-medium">{item.fuel_type}</span>
                        <span className="badge bg-primary fs-6">
                          {formatNumber(Number(item.current_stock))} L
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

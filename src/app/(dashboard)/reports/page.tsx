"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ExportButtons from "@/components/ExportButtons";
import { useStation } from "@/context/StationContext";
import type {
  DailyReading,
  FuelInventory,
  ManagerPerformance,
  StationDirectoryEntry,
  StationSummary,
  StoreSale,
  TimeFilter,
} from "@/lib/types";
import {
  exportToCSV,
  formatDate,
  formatNumber,
  todayString,
} from "@/lib/utils";

type PumpSalesRow = {
  pumpName: string;
  fuelType: string;
  totalLiters: number;
};

export default function ReportsPage() {
  const { activeStationId, activeStation } = useStation();
  const [filter, setFilter] = useState<TimeFilter>("day");
  const [activeTab, setActiveTab] = useState("executive");
  const [fuelReport, setFuelReport] = useState<PumpSalesRow[]>([]);
  const [totalLiters, setTotalLiters] = useState(0);
  const [inventory, setInventory] = useState<FuelInventory[]>([]);
  const [dailySalesTrend, setDailySalesTrend] = useState<
    { date: string; liters: number }[]
  >([]);
  const [stationReadings, setStationReadings] = useState<DailyReading[]>([]);
  const [storeSales, setStoreSales] = useState<StoreSale[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<StationSummary[]>([]);
  const [managerBoard, setManagerBoard] = useState<ManagerPerformance[]>([]);
  const [stationDirectory, setStationDirectory] = useState<StationDirectoryEntry[]>([]);
  const [cashTotal, setCashTotal] = useState(0);
  const [cardTotal, setCardTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [cashInput, setCashInput] = useState("");
  const [cardInput, setCardInput] = useState("");
  const [savingSale, setSavingSale] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ filter });
    if (activeStationId) params.set("stationId", String(activeStationId));

    const res = await fetch(`/api/reports?${params}`);
    if (!res.ok) {
      setLoading(false);
      return;
    }

    const data = await res.json();
    const summary: StationSummary[] = data.executiveSummary ?? [];

    const rankedManagers: ManagerPerformance[] = [...summary]
      .map((row) => ({
        stationId: row.stationId,
        stationName: row.stationName,
        managerName: row.managerName,
        fuelLiters: row.fuelLiters,
        storeRevenue: row.storeRevenue,
        totalSales: row.fuelLiters + row.storeRevenue,
        rank: 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .map((row, index) => ({ ...row, rank: index + 1 }));

    const directory: StationDirectoryEntry[] = summary.map((row) => ({
      stationId: row.stationId,
      name: row.stationName,
      address: row.location,
      phone: row.phone,
      managerName: row.managerName,
      pumpCount: row.pumpCount,
    }));

    setExecutiveSummary(summary);
    setManagerBoard(rankedManagers);
    setStationDirectory(directory);

    if (data.stationData) {
      setFuelReport(data.stationData.fuelReport);
      setTotalLiters(data.stationData.totalLiters);
      setInventory(data.stationData.inventory);
      setDailySalesTrend(data.stationData.dailySalesTrend);
      setStationReadings(data.stationData.stationReadings);
      setStoreSales(data.stationData.storeSales);
      setCashTotal(data.stationData.cashTotal);
      setCardTotal(data.stationData.cardTotal);
    } else {
      setFuelReport([]);
      setTotalLiters(0);
      setInventory([]);
      setDailySalesTrend([]);
      setStationReadings([]);
      setStoreSales([]);
      setCashTotal(0);
      setCardTotal(0);
    }

    setLoading(false);
  }, [filter, activeStationId]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const handleStoreSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStationId) return;

    setSavingSale(true);
    await fetch("/api/store-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        station_id: activeStationId,
        sale_date: todayString(),
        cash_revenue: parseFloat(cashInput) || 0,
        card_revenue: parseFloat(cardInput) || 0,
      }),
    });
    setCashInput("");
    setCardInput("");
    setSavingSale(false);
    await loadReports();
  };

  const filterLabel =
    filter === "day" ? "Today" : filter === "week" ? "This Week" : "This Month";

  const exportFuelCSV = () => {
    exportToCSV(
      `fuel-sales-${activeStation?.name ?? "station"}-${filter}.csv`,
      ["Pump", "Fuel Type", "Liters Sold"],
      [
        ...fuelReport.map((r) => [r.pumpName, r.fuelType, r.totalLiters]),
        ["TOTAL", "", totalLiters],
      ],
    );
  };

  const exportInventoryCSV = () => {
    exportToCSV(
      `inventory-${activeStation?.name ?? "station"}.csv`,
      ["Fuel Type", "Current Stock (L)", "Last Delivery", "Delivery Amount"],
      inventory.map((i) => [
        i.fuel_type,
        i.current_stock,
        i.last_delivery_date ?? "—",
        i.last_delivery_amount ?? "—",
      ]),
    );
  };

  const exportStoreCSV = () => {
    exportToCSV(
      `store-revenue-${activeStation?.name ?? "station"}-${filter}.csv`,
      ["Date", "Cash", "Card", "Total"],
      [
        ...storeSales.map((s) => [
          s.sale_date,
          s.cash_revenue,
          s.card_revenue,
          s.total_revenue,
        ]),
        ["TOTAL", cashTotal, cardTotal, cashTotal + cardTotal],
      ],
    );
  };

  const exportExecutiveCSV = () => {
    exportToCSV(
      `executive-summary-${filter}.csv`,
      ["Station", "Manager", "Address", "Machines", "Fuel Sold (L)", "Store Revenue ($)"],
      executiveSummary.map((row) => [
        row.stationName,
        row.managerName ?? "—",
        row.location ?? "—",
        row.pumpCount,
        row.fuelLiters,
        row.storeRevenue,
      ]),
    );
  };

  const exportManagerCSV = () => {
    exportToCSV(
      `manager-performance-${filter}.csv`,
      ["Rank", "Manager", "Station", "Fuel Sold (L)", "Store Revenue ($)", "Score"],
      managerBoard.map((row) => [
        row.rank,
        row.managerName ?? "—",
        row.stationName,
        row.fuelLiters,
        row.storeRevenue,
        row.totalSales,
      ]),
    );
  };

  const exportDirectoryCSV = () => {
    exportToCSV(
      "station-directory.csv",
      ["Station", "Address", "Phone", "Manager", "Machines"],
      stationDirectory.map((row) => [
        row.name,
        row.address ?? "—",
        row.phone ?? "—",
        row.managerName ?? "—",
        row.pumpCount,
      ]),
    );
  };

  const networkWideTabs = ["executive", "managers", "directory"];
  const tabs = [
    { id: "executive", label: "All Filling Stations" },
    { id: "managers", label: "Manager Board" },
    { id: "directory", label: "Directory" },
    { id: "fuel", label: "Fuel Sales" },
    { id: "inventory", label: "Station Drilldown" },
    { id: "store", label: "Store Revenue" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="h3 fw-bold mb-1">Reports</h1>
        <p className="text-muted mb-0">
          {activeStation
            ? `Viewing ${activeStation.name}`
            : "Select a station for station-specific reports"}
        </p>
      </div>

      {!activeStationId && !networkWideTabs.includes(activeTab) && (
        <div className="alert alert-info">
          Select a station for station-specific reports, or view a{" "}
          <button
            type="button"
            className="btn btn-link p-0 align-baseline"
            onClick={() => setActiveTab("executive")}
          >
            network-wide report
          </button>
          . <Link href="/stations">Manage Filling Stations</Link>
        </div>
      )}

      <ul className="nav nav-pills mb-4 flex-nowrap overflow-auto">
        {(["day", "week", "month"] as TimeFilter[]).map((f) => (
          <li className="nav-item" key={f}>
            <button
              type="button"
              className={`nav-link ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "day" ? "Day" : f === "week" ? "Week" : "Month"}
            </button>
          </li>
        ))}
      </ul>

      <ul className="nav nav-tabs mb-4 flex-nowrap overflow-auto">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              type="button"
              className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div id="report-content">
          {activeTab === "executive" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <h5 className="card-title fw-semibold mb-0">
                    All-Station Executive Summary — {filterLabel}
                  </h5>
                  <ExportButtons onExportCSV={exportExecutiveCSV} />
                </div>
                {executiveSummary.length === 0 ? (
                  <p className="text-muted">No filling stations configured yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Station</th>
                          <th>Manager</th>
                          <th>Address</th>
                          <th className="text-end">Machines</th>
                          <th className="text-end">Fuel Sold (L)</th>
                          <th className="text-end">Store Revenue ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {executiveSummary.map((row) => (
                          <tr
                            key={row.stationId}
                            className={
                              row.stationId === activeStationId
                                ? "table-primary"
                                : ""
                            }
                          >
                            <td className="fw-medium text-break">{row.stationName}</td>
                            <td className="text-break">{row.managerName ?? "—"}</td>
                            <td className="text-muted text-break">{row.location ?? "—"}</td>
                            <td className="text-end">{row.pumpCount}</td>
                            <td className="text-end">{formatNumber(row.fuelLiters)} L</td>
                            <td className="text-end">${formatNumber(row.storeRevenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "managers" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <h5 className="card-title fw-semibold mb-0">
                    Manager Performance Board — {filterLabel}
                  </h5>
                  <ExportButtons onExportCSV={exportManagerCSV} />
                </div>
                {managerBoard.length === 0 ? (
                  <p className="text-muted">No manager data available.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Rank</th>
                          <th>Manager</th>
                          <th>Station</th>
                          <th className="text-end">Fuel Sold (L)</th>
                          <th className="text-end">Store Revenue ($)</th>
                          <th className="text-end">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {managerBoard.map((row) => (
                          <tr key={row.stationId}>
                            <td>
                              <span className="badge bg-secondary">#{row.rank}</span>
                            </td>
                            <td className="fw-medium">{row.managerName ?? "Unassigned"}</td>
                            <td>{row.stationName}</td>
                            <td className="text-end">{formatNumber(row.fuelLiters)} L</td>
                            <td className="text-end">${formatNumber(row.storeRevenue)}</td>
                            <td className="text-end fw-bold">{formatNumber(row.totalSales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "directory" && (
            <div className="card border-0 shadow-sm directory-sheet">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <h5 className="card-title fw-semibold mb-0">Station Directory</h5>
                  <ExportButtons onExportCSV={exportDirectoryCSV} />
                </div>
                {stationDirectory.length === 0 ? (
                  <p className="text-muted">No filling stations in directory.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered align-middle directory-table">
                      <thead className="table-dark">
                        <tr>
                          <th>Station</th>
                          <th>Address</th>
                          <th>Phone</th>
                          <th>Manager</th>
                          <th className="text-end">Machines</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stationDirectory.map((row) => (
                          <tr key={row.stationId}>
                            <td className="fw-semibold">{row.name}</td>
                            <td>{row.address ?? "—"}</td>
                            <td>{row.phone ?? "—"}</td>
                            <td>{row.managerName ?? "—"}</td>
                            <td className="text-end">
                              <span className="badge bg-primary">{row.pumpCount}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "fuel" && activeStationId && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <h5 className="card-title fw-semibold mb-0">
                    Fuel Sales — {activeStation?.name} ({filterLabel})
                  </h5>
                  <ExportButtons onExportCSV={exportFuelCSV} />
                </div>
                {fuelReport.length === 0 ? (
                  <p className="text-muted">No fuel sales in this period.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Pump</th>
                          <th>Fuel Type</th>
                          <th className="text-end">Liters Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fuelReport.map((row, i) => (
                          <tr key={i}>
                            <td>{row.pumpName}</td>
                            <td><span className="badge bg-primary">{row.fuelType}</span></td>
                            <td className="text-end">{formatNumber(row.totalLiters)} L</td>
                          </tr>
                        ))}
                        <tr className="table-primary fw-bold">
                          <td colSpan={2}>Total</td>
                          <td className="text-end">{formatNumber(totalLiters)} L</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "inventory" && activeStationId && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                  <h5 className="card-title fw-semibold mb-0">
                    Station Drilldown — {activeStation?.name}
                  </h5>
                  <ExportButtons onExportCSV={exportInventoryCSV} />
                </div>
                <div className="row g-4">
                  <div className="col-12 col-lg-6">
                    <h6 className="fw-semibold mb-3">Tank Levels</h6>
                    {inventory.length === 0 ? (
                      <p className="text-muted">No inventory data.</p>
                    ) : (
                      <table className="table table-bordered">
                        <thead className="table-light">
                          <tr>
                            <th>Fuel Type</th>
                            <th className="text-end">Stock (L)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.map((item) => (
                            <tr key={item.id}>
                              <td>{item.fuel_type}</td>
                              <td className="text-end">{formatNumber(Number(item.current_stock))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="col-12 col-lg-6">
                    <h6 className="fw-semibold mb-3">Daily Sales Trend</h6>
                    {dailySalesTrend.length === 0 ? (
                      <p className="text-muted">No trend data.</p>
                    ) : (
                      <ul className="list-group">
                        {dailySalesTrend.map((day) => (
                          <li key={day.date} className="list-group-item d-flex justify-content-between">
                            <span>{formatDate(day.date)}</span>
                            <strong>{formatNumber(day.liters)} L</strong>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="col-12">
                    <h6 className="fw-semibold mb-3">Meter Readings</h6>
                    {stationReadings.length === 0 ? (
                      <p className="text-muted">No readings in this period.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Date</th>
                              <th>Pump</th>
                              <th>Fuel</th>
                              <th className="text-end">Sold (L)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stationReadings.map((r) => (
                              <tr key={r.id}>
                                <td>{formatDate(r.reading_date)}</td>
                                <td>{r.pumps?.name}</td>
                                <td>{r.pumps?.fuel_type}</td>
                                <td className="text-end">{formatNumber(Number(r.liters_sold))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "store" && activeStationId && (
            <>
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="card-title fw-semibold mb-3">Log Store Sale (Today)</h5>
                  <form className="row g-3" onSubmit={(e) => void handleStoreSaleSubmit(e)}>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Cash Revenue</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-lg"
                        value={cashInput}
                        onChange={(e) => setCashInput(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Card Revenue</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-lg"
                        value={cardInput}
                        onChange={(e) => setCardInput(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4 d-flex align-items-end">
                      <button type="submit" className="btn btn-success btn-lg w-100" disabled={savingSale}>
                        {savingSale ? "Saving..." : "Save Sale"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h5 className="card-title fw-semibold mb-0">
                      Store Revenue — {filterLabel}
                    </h5>
                    <ExportButtons onExportCSV={exportStoreCSV} />
                  </div>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="p-3 bg-success bg-opacity-10 rounded text-center">
                        <small className="text-muted d-block">Cash</small>
                        <strong className="fs-4">${formatNumber(cashTotal)}</strong>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3 bg-primary bg-opacity-10 rounded text-center">
                        <small className="text-muted d-block">Card</small>
                        <strong className="fs-4">${formatNumber(cardTotal)}</strong>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="p-3 bg-dark bg-opacity-10 rounded text-center">
                        <small className="text-muted d-block">Total</small>
                        <strong className="fs-4">${formatNumber(cashTotal + cardTotal)}</strong>
                      </div>
                    </div>
                  </div>
                  {storeSales.length === 0 ? (
                    <p className="text-muted">No store sales in this period.</p>
                  ) : (
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th className="text-end">Cash</th>
                          <th className="text-end">Card</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeSales.map((sale) => (
                          <tr key={sale.id}>
                            <td>{formatDate(sale.sale_date)}</td>
                            <td className="text-end">${formatNumber(Number(sale.cash_revenue))}</td>
                            <td className="text-end">${formatNumber(Number(sale.card_revenue))}</td>
                            <td className="text-end">${formatNumber(Number(sale.total_revenue))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

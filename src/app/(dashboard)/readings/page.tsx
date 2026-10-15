"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStation } from "@/context/StationContext";
import type { DailyReading, Pump } from "@/lib/types";
import {
  formatCurrency,
  formatNumber,
  formatUnitNozzle,
  todayString,
} from "@/lib/utils";

export default function ReadingsPage() {
  const { activeStationId, activeStation } = useStation();
  const [units, setUnits] = useState<Pump[]>([]);
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [pumpId, setPumpId] = useState("");
  const [readingDate, setReadingDate] = useState(todayString());
  const [startReading, setStartReading] = useState("");
  const [endReading, setEndReading] = useState("");
  const [price, setPrice] = useState("");
  const [endError, setEndError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeStationId) {
      setUnits([]);
      setReadings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = todayString();

    const [unitsRes, readingsRes] = await Promise.all([
      fetch(`/api/pumps?stationId=${activeStationId}`),
      fetch(`/api/readings?stationId=${activeStationId}&date=${today}`),
    ]);

    if (!unitsRes.ok || !readingsRes.ok) {
      setError("Failed to load data.");
    } else {
      const loadedUnits = await unitsRes.json();
      setUnits(loadedUnits);
      setReadings(await readingsRes.json());
      setPumpId((current) => {
        if (current && loadedUnits.some((u: Pump) => String(u.id) === current)) {
          return current;
        }
        return loadedUnits[0] ? String(loadedUnits[0].id) : "";
      });
    }
    setLoading(false);
  }, [activeStationId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const todayTotals = useMemo(() => {
    const liters = readings.reduce(
      (sum, r) => sum + Number(r.liters_sold || 0),
      0,
    );
    const amount = readings.reduce((sum, r) => {
      const litersSold = Number(r.liters_sold || 0);
      const unitPrice = r.price == null ? 0 : Number(r.price);
      return sum + litersSold * unitPrice;
    }, 0);
    return { liters, amount };
  }, [readings]);

  const validateEndReading = (start: string, end: string): boolean => {
    const startNum = parseFloat(start);
    const endNum = parseFloat(end);

    if (end === "" || isNaN(endNum)) {
      setEndError(null);
      return false;
    }

    if (isNaN(startNum)) {
      setEndError("Enter a valid start reading first.");
      return false;
    }

    if (endNum <= startNum) {
      setEndError("End reading must be greater than start reading.");
      return false;
    }

    setEndError(null);
    return true;
  };

  const handleStartChange = (value: string) => {
    setStartReading(value);
    if (endReading) validateEndReading(value, endReading);
  };

  const handleEndChange = (value: string) => {
    setEndReading(value);
    validateEndReading(startReading, value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    if (!validateEndReading(startReading, endReading)) return;

    setSaving(true);
    const res = await fetch("/api/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pump_id: parseInt(pumpId, 10),
        start_reading: parseFloat(startReading),
        end_reading: parseFloat(endReading),
        reading_date: readingDate || todayString(),
        price: price === "" ? null : parseFloat(price),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to save reading.");
    } else {
      setStartReading("");
      setEndReading("");
      setPrice("");
      setReadingDate(todayString());
      setEndError(null);
      setSuccess("Reading logged successfully!");
      setError(null);
      await loadData();
    }
    setSaving(false);
  };

  const endInputClass = endError
    ? "form-control form-control-lg is-invalid"
    : endReading && !endError
      ? "form-control form-control-lg is-valid"
      : "form-control form-control-lg";

  if (!activeStationId) {
    return (
      <div>
        <div className="page-header">
          <h1 className="h3 fw-bold mb-1">Daily Readings</h1>
        </div>
        <div className="alert alert-info">
          Select or create a filling station first.{" "}
          <Link href="/stations">Go to Filling Stations</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="h3 fw-bold mb-1">Daily Readings</h1>
        <p className="text-muted mb-0">
          Log meter readings for <strong>{activeStation?.name}</strong>
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title fw-semibold mb-3">New Reading</h5>

          {units.length === 0 ? (
            <p className="text-muted mb-0">
              No units at this station.{" "}
              <Link href="/pumps">Add a unit</Link> first.
            </p>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label">Unit / Nozzle</label>
                  <select
                    className="form-select form-select-lg"
                    value={pumpId}
                    onChange={(e) => setPumpId(e.target.value)}
                    required
                  >
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {formatUnitNozzle(unit)} ({unit.fuel_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control form-control-lg"
                    value={readingDate}
                    onChange={(e) => setReadingDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-lg"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 3.45"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Start Reading</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-lg"
                    value={startReading}
                    onChange={(e) => handleStartChange(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">End Reading</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={endInputClass}
                    value={endReading}
                    onChange={(e) => handleEndChange(e.target.value)}
                    required
                  />
                  {endError && (
                    <div className="invalid-feedback d-block">{endError}</div>
                  )}
                </div>
                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={saving || !!endError}
                  >
                    {saving ? "Saving..." : "Log Reading"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h5 className="card-title fw-semibold mb-0">Today&apos;s Readings</h5>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-primary-subtle text-primary-emphasis fs-6 px-3 py-2">
                Total: {formatNumber(todayTotals.liters)} L
              </span>
              <span className="badge bg-success-subtle text-success-emphasis fs-6 px-3 py-2">
                {formatCurrency(todayTotals.amount)}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : readings.length === 0 ? (
            <p className="text-muted mb-0">No readings logged today.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {readings.map((reading) => {
                const liters = Number(reading.liters_sold);
                const unitPrice = reading.price == null ? null : Number(reading.price);
                const amount =
                  unitPrice == null ? null : liters * unitPrice;

                return (
                  <li
                    key={reading.id}
                    className="list-group-item reading-list-item px-0 py-3"
                  >
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                      <div>
                        <strong>
                          {reading.pumps
                            ? formatUnitNozzle(reading.pumps)
                            : `Unit #${reading.pump_id}`}
                        </strong>
                        <span className="badge bg-secondary ms-2">
                          {reading.pumps?.fuel_type}
                        </span>
                        <div className="text-muted small mt-1">
                          {formatNumber(Number(reading.start_reading))} →{" "}
                          {formatNumber(Number(reading.end_reading))}
                          {unitPrice != null && (
                            <> · {formatCurrency(unitPrice)}/L</>
                          )}
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-primary fs-6">
                          {formatNumber(liters)} L
                        </span>
                        {amount != null && (
                          <div className="small text-muted mt-1">
                            {formatCurrency(amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

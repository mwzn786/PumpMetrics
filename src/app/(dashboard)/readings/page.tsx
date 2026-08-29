"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useStation } from "@/context/StationContext";
import type { DailyReading, Pump } from "@/lib/types";
import { formatNumber, todayString } from "@/lib/utils";

export default function ReadingsPage() {
  const { activeStationId, activeStation } = useStation();
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [pumpId, setPumpId] = useState("");
  const [startReading, setStartReading] = useState("");
  const [endReading, setEndReading] = useState("");
  const [endError, setEndError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeStationId) {
      setPumps([]);
      setReadings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = todayString();

    const [pumpsRes, readingsRes] = await Promise.all([
      fetch(`/api/pumps?stationId=${activeStationId}`),
      fetch(`/api/readings?stationId=${activeStationId}&date=${today}`),
    ]);

    if (!pumpsRes.ok || !readingsRes.ok) {
      setError("Failed to load data.");
    } else {
      const loadedPumps = await pumpsRes.json();
      setPumps(loadedPumps);
      setReadings(await readingsRes.json());
      setPumpId((current) => {
        if (current && loadedPumps.some((p: Pump) => String(p.id) === current)) {
          return current;
        }
        return loadedPumps[0] ? String(loadedPumps[0].id) : "";
      });
    }
    setLoading(false);
  }, [activeStationId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
        reading_date: todayString(),
      }),
    });

    if (!res.ok) {
      setError("Failed to save reading.");
    } else {
      setStartReading("");
      setEndReading("");
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
          Select or create a station first.{" "}
          <Link href="/stations">Go to Stations</Link>
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

          {pumps.length === 0 ? (
            <p className="text-muted mb-0">
              No pumps at this station.{" "}
              <Link href="/pumps">Add a pump</Link> first.
            </p>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label">Pump</label>
                  <select
                    className="form-select form-select-lg"
                    value={pumpId}
                    onChange={(e) => setPumpId(e.target.value)}
                    required
                  >
                    {pumps.map((pump) => (
                      <option key={pump.id} value={pump.id}>
                        {pump.name} ({pump.fuel_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-4">
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
                <div className="col-12 col-md-4">
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
          <h5 className="card-title fw-semibold mb-3">Today&apos;s Readings</h5>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : readings.length === 0 ? (
            <p className="text-muted mb-0">No readings logged today.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {readings.map((reading) => (
                <li
                  key={reading.id}
                  className="list-group-item reading-list-item px-0 py-3"
                >
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                      <strong>
                        {reading.pumps?.name ?? `Pump #${reading.pump_id}`}
                      </strong>
                      <span className="badge bg-secondary ms-2">
                        {reading.pumps?.fuel_type}
                      </span>
                      <div className="text-muted small mt-1">
                        {formatNumber(Number(reading.start_reading))} →{" "}
                        {formatNumber(Number(reading.end_reading))}
                      </div>
                    </div>
                    <span className="badge bg-primary fs-6">
                      {formatNumber(Number(reading.liters_sold))} L
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

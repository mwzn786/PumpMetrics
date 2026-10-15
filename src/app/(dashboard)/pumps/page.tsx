"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStation } from "@/context/StationContext";
import type { Pump, Tank } from "@/lib/types";
import { formatNumber, formatUnitNozzle } from "@/lib/utils";

function fuelBadgeClass(fuelType: string): string {
  const map: Record<string, string> = {
    Regular: "fuel-badge-regular",
    Premium: "fuel-badge-premium",
    Diesel: "fuel-badge-diesel",
  };
  return map[fuelType] ?? "bg-secondary";
}

export default function UnitsPage() {
  const { activeStationId, activeStation } = useStation();
  const [units, setUnits] = useState<Pump[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unitNumber, setUnitNumber] = useState("");
  const [nozzleNumber, setNozzleNumber] = useState("");
  const [tankId, setTankId] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    if (!activeStationId) {
      setUnits([]);
      setTanks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [unitsRes, tanksRes] = await Promise.all([
      fetch(`/api/pumps?stationId=${activeStationId}`),
      fetch(`/api/tanks?stationId=${activeStationId}`),
    ]);

    if (unitsRes.ok && tanksRes.ok) {
      const loadedTanks = await tanksRes.json();
      setUnits(await unitsRes.json());
      setTanks(loadedTanks);
      setTankId((current) => {
        if (current && loadedTanks.some((t: Tank) => String(t.id) === current)) {
          return current;
        }
        return loadedTanks[0] ? String(loadedTanks[0].id) : "";
      });
      setError(null);
    } else {
      setError("Failed to load units.");
    }
    setLoading(false);
  }, [activeStationId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setUnitNumber("");
    setNozzleNumber("");
    setTankId(tanks[0] ? String(tanks[0].id) : "");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim() || !nozzleNumber.trim() || !tankId || !activeStationId) {
      return;
    }

    setSaving(true);
    const res = await fetch("/api/pumps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unit_number: unitNumber.trim(),
        nozzle_number: nozzleNumber.trim(),
        tank_id: parseInt(tankId, 10),
        station_id: activeStationId,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add unit.");
    } else {
      resetForm();
      setError(null);
      await loadData();

      const modalEl = modalRef.current;
      if (modalEl) {
        const { Modal } = await import("bootstrap");
        Modal.getInstance(modalEl)?.hide();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, label: string) => {
    if (!confirm(`Delete "${label}"? This will also remove its readings.`)) {
      return;
    }

    const res = await fetch(`/api/pumps?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete unit.");
    } else {
      setUnits((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const selectedTank = tanks.find((t) => String(t.id) === tankId);

  if (!activeStationId) {
    return (
      <div>
        <div className="page-header">
          <h1 className="h3 fw-bold mb-1">Units</h1>
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
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h1 className="h3 fw-bold mb-1">Units</h1>
          <p className="text-muted mb-0">
            Units at <strong>{activeStation?.name}</strong>
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#addUnitModal"
          disabled={tanks.length === 0}
        >
          <i className="bi bi-plus-lg me-1" />
          Add Unit
        </button>
      </div>

      {tanks.length === 0 && !loading && (
        <div className="alert alert-warning">
          Add a tank first so nozzles can draw supply.{" "}
          <Link href="/tanks">Go to Tanks</Link>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : units.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-fuel-pump display-4 d-block mb-3" />
          <p>No units at this station yet. Add your first unit.</p>
        </div>
      ) : (
        <div className="row g-3">
          {units.map((unit) => {
            const label = formatUnitNozzle(unit);
            return (
              <div key={unit.id} className="col-12 col-sm-6 col-lg-4">
                <div className="card pump-card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="card-title fw-bold mb-1">{label}</h5>
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          {unit.unit_number && (
                            <span className="badge bg-light text-dark border">
                              Unit #{unit.unit_number}
                            </span>
                          )}
                          {unit.nozzle_number && (
                            <span className="badge bg-light text-dark border">
                              Nozzle #{unit.nozzle_number}
                            </span>
                          )}
                        </div>
                        <span className={`badge ${fuelBadgeClass(unit.fuel_type)}`}>
                          {unit.fuel_type}
                        </span>
                        {unit.tank && (
                          <div className="small text-muted mt-2">
                            <span
                              className="rounded-circle border me-1"
                              style={{
                                width: 10,
                                height: 10,
                                backgroundColor: unit.tank.color,
                                display: "inline-block",
                              }}
                            />
                            Tank {unit.tank.code} — {unit.tank.name}
                            <br />
                            Stock: {formatNumber(unit.tank.current_stock)} L
                          </div>
                        )}
                      </div>
                      <i className="bi bi-fuel-pump fs-2 text-primary opacity-50" />
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => void handleDelete(unit.id, label)}
                    >
                      <i className="bi bi-trash me-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="modal fade"
        id="addUnitModal"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="modal-header">
                <h5 className="modal-title">Add New Unit</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>
              <div className="modal-body">
                <div className="alert alert-light border mb-3 py-2">
                  <small>
                    Linking to: <strong>{activeStation?.name}</strong>
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Unit Number</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="e.g. 1"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Nozzle Number</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={nozzleNumber}
                    onChange={(e) => setNozzleNumber(e.target.value)}
                    placeholder="e.g. 2"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Supply Tank</label>
                  <select
                    className="form-select form-select-lg"
                    value={tankId}
                    onChange={(e) => setTankId(e.target.value)}
                    required
                  >
                    {tanks.map((tank) => (
                      <option key={tank.id} value={tank.id}>
                        {tank.code} — {tank.name} ({tank.fuel_type})
                      </option>
                    ))}
                  </select>
                  {selectedTank && (
                    <div className="form-text">
                      Nozzle fuel type will be{" "}
                      <strong>{selectedTank.fuel_type}</strong> from this tank.
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || !tankId}>
                  {saving ? "Saving..." : "Add Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

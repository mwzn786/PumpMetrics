"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStation } from "@/context/StationContext";
import { FUEL_TYPES } from "@/lib/fuel";
import type { Tank } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const DEFAULT_COLORS = ["#0d6efd", "#198754", "#dc3545", "#fd7e14", "#6f42c1", "#20c997"];

export default function TanksPage() {
  const { activeStationId, activeStation } = useStation();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [fuelType, setFuelType] = useState<string>(FUEL_TYPES[0]);
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [maxCapacity, setMaxCapacity] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const loadTanks = useCallback(async () => {
    if (!activeStationId) {
      setTanks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/tanks?stationId=${activeStationId}`);
    if (res.ok) {
      setTanks(await res.json());
      setError(null);
    } else {
      setError("Failed to load tanks.");
    }
    setLoading(false);
  }, [activeStationId]);

  useEffect(() => {
    void loadTanks();
  }, [loadTanks]);

  const resetForm = () => {
    setCode("");
    setName("");
    setFuelType(FUEL_TYPES[0]);
    setColor(DEFAULT_COLORS[0]);
    setMaxCapacity("");
    setCurrentStock("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !activeStationId) return;

    setSaving(true);
    const res = await fetch("/api/tanks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code.trim(),
        name: name.trim(),
        fuel_type: fuelType,
        color,
        max_capacity: parseFloat(maxCapacity),
        current_stock: currentStock === "" ? 0 : parseFloat(currentStock),
        station_id: activeStationId,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add tank.");
    } else {
      resetForm();
      setError(null);
      await loadTanks();
      const modalEl = modalRef.current;
      if (modalEl) {
        const { Modal } = await import("bootstrap");
        Modal.getInstance(modalEl)?.hide();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (tank: Tank) => {
    if (!confirm(`Delete tank "${tank.name}" (${tank.code})?`)) return;

    const res = await fetch(`/api/tanks?id=${tank.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete tank.");
    } else {
      setTanks((prev) => prev.filter((t) => t.id !== tank.id));
    }
  };

  if (!activeStationId) {
    return (
      <div>
        <div className="page-header">
          <h1 className="h3 fw-bold mb-1">Tanks</h1>
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
          <h1 className="h3 fw-bold mb-1">Tanks</h1>
          <p className="text-muted mb-0">
            Underground tanks at <strong>{activeStation?.name}</strong>
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#addTankModal"
        >
          <i className="bi bi-plus-lg me-1" />
          Add Tank
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : tanks.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-droplet-half display-4 d-block mb-3" />
          <p>No tanks yet. Add a tank before linking nozzles.</p>
        </div>
      ) : (
        <div className="row g-3">
          {tanks.map((tank) => {
            const pct =
              tank.max_capacity > 0
                ? Math.min(100, (tank.current_stock / tank.max_capacity) * 100)
                : 0;
            return (
              <div key={tank.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span
                            className="rounded-circle border"
                            style={{
                              width: 16,
                              height: 16,
                              backgroundColor: tank.color,
                              display: "inline-block",
                            }}
                          />
                          <h5 className="card-title fw-bold mb-0">{tank.name}</h5>
                        </div>
                        <span className="badge bg-secondary-subtle text-secondary-emphasis">
                          {tank.code}
                        </span>
                        <span className="badge bg-light text-dark border ms-1">
                          {tank.fuel_type}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Current stock</span>
                        <strong>
                          {formatNumber(tank.current_stock)} /{" "}
                          {formatNumber(tank.max_capacity)} L
                        </strong>
                      </div>
                      <div className="progress" style={{ height: 10 }}>
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

                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => void handleDelete(tank)}
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

      <div className="modal fade" id="addTankModal" tabIndex={-1} ref={modalRef}>
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="modal-header">
                <h5 className="modal-title">Add New Tank</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>
              <div className="modal-body">
                <div className="alert alert-light border mb-3 py-2">
                  <small>
                    Linking to: <strong>{activeStation?.name}</strong>
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Tank Code</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. T-01"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Tank Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Regular Petrol Main Tank"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Fuel Type</label>
                  <select
                    className="form-select form-select-lg"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    required
                  >
                    {FUEL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Color</label>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      title="Choose tank color"
                    />
                    {DEFAULT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="btn btn-sm border p-0"
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: c,
                          outline: color === c ? "2px solid #212529" : "none",
                        }}
                        onClick={() => setColor(c)}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Maximum Capacity (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control form-control-lg"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    placeholder="e.g. 20000"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Initial Stock (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control form-control-lg"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    placeholder="Defaults to 0"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Add Tank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

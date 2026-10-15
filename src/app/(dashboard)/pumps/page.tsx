"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStation } from "@/context/StationContext";
import type { Pump } from "@/lib/types";

const FUEL_TYPES = ["Regular", "Premium", "Diesel"];

function fuelBadgeClass(fuelType: string): string {
  const map: Record<string, string> = {
    Regular: "fuel-badge-regular",
    Premium: "fuel-badge-premium",
    Diesel: "fuel-badge-diesel",
  };
  return map[fuelType] ?? "bg-secondary";
}

export default function PumpsPage() {
  const { activeStationId, activeStation } = useStation();
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [fuelType, setFuelType] = useState(FUEL_TYPES[0]);
  const modalRef = useRef<HTMLDivElement>(null);

  const loadPumps = useCallback(async () => {
    if (!activeStationId) {
      setPumps([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/pumps?stationId=${activeStationId}`);
    if (res.ok) {
      setPumps(await res.json());
      setError(null);
    } else {
      setError("Failed to load units.");
    }
    setLoading(false);
  }, [activeStationId]);

  useEffect(() => {
    void loadPumps();
  }, [loadPumps]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeStationId) return;

    setSaving(true);
    const res = await fetch("/api/pumps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        fuel_type: fuelType,
        branch_code: branchCode.trim() || null,
        station_id: activeStationId,
      }),
    });

    if (!res.ok) {
      setError("Failed to add unit.");
    } else {
      setName("");
      setBranchCode("");
      setFuelType(FUEL_TYPES[0]);
      setError(null);
      await loadPumps();

      const modalEl = modalRef.current;
      if (modalEl) {
        const { Modal } = await import("bootstrap");
        Modal.getInstance(modalEl)?.hide();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, pumpName: string) => {
    if (!confirm(`Delete unit "${pumpName}"? This will also remove its readings.`)) {
      return;
    }

    const res = await fetch(`/api/pumps?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete unit.");
    } else {
      setPumps((prev) => prev.filter((p) => p.id !== id));
    }
  };

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
            Machines at <strong>{activeStation?.name}</strong>
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#addPumpModal"
        >
          <i className="bi bi-plus-lg me-1" />
          Add Unit
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : pumps.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-fuel-pump display-4 d-block mb-3" />
          <p>No units at this filling station yet. Add your first machine.</p>
        </div>
      ) : (
        <div className="row g-3">
          {pumps.map((pump) => (
            <div key={pump.id} className="col-12 col-sm-6 col-lg-4">
              <div className="card pump-card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title fw-bold mb-1">{pump.name}</h5>
                      <span className={`badge ${fuelBadgeClass(pump.fuel_type)}`}>
                        {pump.fuel_type}
                      </span>
                      {pump.branch_code && (
                        <div className="text-muted small mt-2">
                          Branch: {pump.branch_code}
                        </div>
                      )}
                    </div>
                    <i className="bi bi-fuel-pump fs-2 text-primary opacity-50" />
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm w-100"
                    onClick={() => void handleDelete(pump.id, pump.name)}
                  >
                    <i className="bi bi-trash me-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="modal fade"
        id="addPumpModal"
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
                  <label className="form-label" htmlFor="unitName">
                    Unit Name / ID
                  </label>
                  <input
                    id="unitName"
                    type="text"
                    className="form-control form-control-lg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="branchCode">
                    Branch Code
                  </label>
                  <input
                    id="branchCode"
                    type="text"
                    className="form-control form-control-lg"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="e.g. BR-001"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="fuelType">
                    Fuel Type
                  </label>
                  <select
                    id="fuelType"
                    className="form-select form-select-lg"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                  >
                    {FUEL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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

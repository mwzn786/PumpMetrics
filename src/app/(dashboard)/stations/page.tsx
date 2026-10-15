"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useStation } from "@/context/StationContext";
import type { Station } from "@/lib/types";

export default function StationsPage() {
  const { stations, activeStationId, setActiveStationId, refreshStations } =
    useStation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [managerName, setManagerName] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const loadStations = useCallback(async () => {
    setLoading(true);
    await refreshStations();
    setLoading(false);
  }, [refreshStations]);

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

  const resetForm = () => {
    setName("");
    setStationCode("");
    setAddress("");
    setPhone("");
    setManagerName("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const res = await fetch("/api/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        station_code: stationCode.trim() || null,
        location: address.trim() || null,
        phone: phone.trim() || null,
        manager_name: managerName.trim() || null,
      }),
    });

    if (!res.ok) {
      setError("Failed to add filling station.");
    } else {
      const data = (await res.json()) as Station;
      resetForm();
      setError(null);
      await refreshStations();

      if (data && !activeStationId) {
        setActiveStationId(data.id);
      }

      const modalEl = modalRef.current;
      if (modalEl) {
        const { Modal } = await import("bootstrap");
        Modal.getInstance(modalEl)?.hide();
      }
    }
    setSaving(false);
  };

  const handleSelectStation = (id: number) => {
    setActiveStationId(id);
  };

  return (
    <div>
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h1 className="h3 fw-bold mb-1">Filling Stations</h1>
          <p className="text-muted mb-0">
            Manage locations and select your active filling station
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#addStationModal"
        >
          <i className="bi bi-plus-lg me-1" />
          Add Filling Station
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : stations.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-geo-alt display-4 d-block mb-3" />
          <p>No filling stations yet. Add your first location.</p>
        </div>
      ) : (
        <div className="row g-3 g-md-4">
          {stations.map((station) => {
            const isActive = station.id === activeStationId;
            const machineCount = station.pumpCount ?? 0;

            return (
              <div key={station.id} className="col-12 col-lg-6">
                <button
                  type="button"
                  className={`station-card card border-0 shadow-sm w-100 text-start h-100 ${
                    isActive ? "station-card-active" : ""
                  }`}
                  onClick={() => handleSelectStation(station.id)}
                  aria-pressed={isActive}
                >
                  <div className="card-body p-3 p-md-4 d-flex flex-column gap-3">
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <div>
                        <h4 className="fw-bold mb-0 text-break station-card-title">
                          {station.name}
                        </h4>
                        {station.station_code && (
                          <span className="badge bg-secondary-subtle text-secondary-emphasis mt-1">
                            Code: {station.station_code}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <span className="badge bg-success flex-shrink-0">
                          <i className="bi bi-check-circle me-1" />
                          Active
                        </span>
                      )}
                    </div>

                    <div className="station-card-detail text-muted text-break">
                      <i className="bi bi-geo-alt-fill text-primary me-2 flex-shrink-0" />
                      <span>{station.location ?? "No address on file"}</span>
                    </div>

                    <div className="row g-2 g-sm-3">
                      <div className="col-12 col-sm-6">
                        <div className="station-meta-pill">
                          <i className="bi bi-telephone-fill text-success" />
                          <span className="text-break">
                            {station.phone ?? "No phone"}
                          </span>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="station-meta-pill">
                          <i className="bi bi-person-fill text-info" />
                          <span className="text-break">
                            {station.manager_name ?? "No manager"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-auto pt-2 border-top">
                      <span className="badge bg-primary-subtle text-primary-emphasis station-machine-badge">
                        <i className="bi bi-fuel-pump me-1" />
                        {machineCount} Unit{machineCount === 1 ? "" : "s"}
                      </span>
                      <small className="text-muted">Tap to activate</small>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="modal fade"
        id="addStationModal"
        tabIndex={-1}
        aria-labelledby="addStationModalLabel"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="modal-header">
                <h5 className="modal-title" id="addStationModalLabel">
                  Add New Station
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="stationName" className="form-label">
                    Station Name
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="stationName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Downtown Station"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="stationCode" className="form-label">
                    Station Code
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="stationCode"
                    value={stationCode}
                    onChange={(e) => setStationCode(e.target.value)}
                    placeholder="e.g. FS-001"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="stationAddress" className="form-label">
                    Address
                  </label>
                  <textarea
                    className="form-control"
                    id="stationAddress"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Main St, City, State"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="stationPhone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-control form-control-lg"
                    id="stationPhone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. (555) 123-4567"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="stationManager" className="form-label">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="stationManager"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Jane Smith"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Add Station"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

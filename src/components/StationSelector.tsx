"use client";

import { useStation } from "@/context/StationContext";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/lib/permissions";

export default function StationSelector() {
  const { stations, activeStationId, activeStation, setActiveStationId, loading, stationLocked } =
    useStation();

  if (loading) {
    return (
      <div
        className="station-selector-placeholder spinner-border spinner-border-sm text-secondary"
        role="status"
      />
    );
  }

  if (stationLocked && activeStation) {
    return (
      <div
        className="station-selector-locked badge bg-light text-dark border d-flex align-items-center gap-2 py-2 px-3"
        title="Your station is assigned by your administrator"
      >
        <i className="bi bi-lock-fill text-muted" />
        <span className="station-selector-label text-truncate fw-medium">
          {activeStation.name}
        </span>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <span className="badge bg-warning text-dark">No stations</span>
    );
  }

  return (
    <div className="dropdown station-selector">
      <button
        className="btn btn-outline-primary btn-sm dropdown-toggle d-flex align-items-center gap-2"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="bi bi-geo-alt-fill" />
        <span className="station-selector-label text-truncate">
          {activeStation?.name ?? "Select Station"}
        </span>
      </button>
      <ul className="dropdown-menu dropdown-menu-end shadow">
        {stations.map((station) => (
          <li key={station.id}>
            <button
              type="button"
              className={`dropdown-item d-flex align-items-center gap-2 ${
                station.id === activeStationId ? "active" : ""
              }`}
              onClick={() => setActiveStationId(station.id)}
            >
              <i className="bi bi-building" />
              <div className="text-start flex-grow-1 min-w-0">
                <div className="fw-medium text-truncate">{station.name}</div>
                {station.location && (
                  <small className="text-muted d-block text-truncate">
                    {station.location}
                  </small>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UserMenu() {
  const { profile, role, signOut } = useAuth();

  if (!profile || !role) return null;

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-secondary btn-sm dropdown-toggle d-flex align-items-center gap-2"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="bi bi-person-circle" />
        <span className="d-none d-md-inline text-truncate user-menu-name">
          {profile.name}
        </span>
      </button>
      <ul className="dropdown-menu dropdown-menu-end shadow">
        <li className="dropdown-header text-wrap">
          <div className="fw-medium">{profile.name}</div>
          <small className="text-muted">{profile.email}</small>
          <div className="mt-1">
            <span className="badge bg-secondary">
              {ROLES[role].icon} {ROLES[role].label}
            </span>
          </div>
        </li>
        <li><hr className="dropdown-divider" /></li>
        <li>
          <button type="button" className="dropdown-item text-danger" onClick={() => void signOut()}>
            <i className="bi bi-box-arrow-right me-2" />
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  );
}

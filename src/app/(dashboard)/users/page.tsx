"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStation } from "@/context/StationContext";
import { ROLES } from "@/lib/permissions";
import type { UserProfile, UserRole } from "@/lib/types";
import AccessDenied from "@/components/AccessDenied";

const ROLE_OPTIONS: UserRole[] = ["super_admin", "station_manager", "cashier"];

export default function UsersPage() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const { stations } = useStation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("cashier");
  const [stationId, setStationId] = useState("");
  const [password, setPassword] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) {
      setUsers(await res.json());
      setError(null);
    } else {
      setError("Failed to load users.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      void loadUsers();
    }
  }, [isSuperAdmin, loadUsers]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("cashier");
    setStationId(stations[0] ? String(stations[0].id) : "");
    setPassword("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        role,
        station_id: role === "super_admin" ? null : parseInt(stationId, 10),
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create user.");
    } else {
      setSuccess(`User ${name.trim()} created successfully`);
      resetForm();
      await loadUsers();

      const modalEl = modalRef.current;
      if (modalEl) {
        const { Modal } = await import("bootstrap");
        Modal.getInstance(modalEl)?.hide();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`Remove user "${user.name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to delete user.");
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
  };

  if (authLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <AccessDenied />;
  }

  const stationDisabled = role === "super_admin";

  return (
    <div>
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3">
        <div>
          <h1 className="h3 fw-bold mb-1">
            <span className="me-2">{ROLES.super_admin.icon}</span>
            User Management
          </h1>
          <p className="text-muted mb-0">
            Create and manage team accounts (Super Admin only)
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#addUserModal"
          onClick={resetForm}
        >
          <i className="bi bi-person-plus me-1" />
          Add User
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted text-center py-5 mb-0">
              No users yet. Add your first team member.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Assigned Station</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const stationData = user.stations as
                      | { name: string }
                      | { name: string }[]
                      | null
                      | undefined;
                    const stationName = Array.isArray(stationData)
                      ? stationData[0]?.name
                      : stationData?.name;

                    return (
                      <tr key={user.id}>
                        <td className="fw-medium text-break">{user.name}</td>
                        <td className="text-break">{user.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              user.role === "super_admin"
                                ? "bg-dark"
                                : user.role === "station_manager"
                                  ? "bg-primary"
                                  : "bg-secondary"
                            }`}
                          >
                            {ROLES[user.role].icon} {ROLES[user.role].label}
                          </span>
                        </td>
                        <td className="text-break">
                          {user.role === "super_admin"
                            ? "All stations"
                            : (stationName ?? "—")}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => void handleDelete(user)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="row g-3 mt-2">
        {ROLE_OPTIONS.map((r) => (
          <div key={r} className="col-12 col-md-4">
            <div className="card border-0 bg-light h-100">
              <div className="card-body py-3">
                <strong>
                  {ROLES[r].icon} {ROLES[r].label}
                </strong>
                <p className="small text-muted mb-0">{ROLES[r].description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="modal fade"
        id="addUserModal"
        tabIndex={-1}
        aria-labelledby="addUserModalLabel"
        aria-hidden="true"
        ref={modalRef}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="modal-header">
                <h5 className="modal-title" id="addUserModalLabel">
                  Add New User
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
                  <label htmlFor="userName" className="form-label">
                    Name
                  </label>
                  <input
                    type="text"
                    id="userName"
                    className="form-control form-control-lg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="userEmail" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="userEmail"
                    className="form-control form-control-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="userRole" className="form-label">
                    Role
                  </label>
                  <select
                    id="userRole"
                    className="form-select form-select-lg"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {ROLES[r].icon} {ROLES[r].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="userStation" className="form-label">
                    Assigned Station
                  </label>
                  <select
                    id="userStation"
                    className="form-select form-select-lg"
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    disabled={stationDisabled}
                    required={!stationDisabled}
                  >
                    <option value="">Select station...</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {stationDisabled && (
                    <small className="text-muted">
                      Super Admins have access to all stations
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="userPassword" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    id="userPassword"
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    placeholder="Min. 8 characters"
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
                  {saving ? "Saving..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

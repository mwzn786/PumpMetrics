"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getDefaultRoute, ROLES } from "@/lib/permissions";
import { useSearchParams } from "next/navigation";

export default function AccessDenied() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const homeRoute = getDefaultRoute(role);

  return (
    <div className="d-flex align-items-center justify-content-center py-5">
      <div className="card border-0 shadow-sm access-denied-card w-100">
        <div className="card-body text-center p-4 p-md-5">
          <div className="access-denied-icon mb-3">
            <i className="bi bi-shield-lock-fill" />
          </div>
          <h2 className="h4 fw-bold mb-2">Access Denied</h2>
          <p className="text-muted mb-4">
            You don&apos;t have permission to view this page.
            {from && (
              <>
                {" "}
                Attempted: <code className="text-break">{from}</code>
              </>
            )}
          </p>

          {role && (
            <div className="alert alert-light border mb-4">
              <span className="me-2">{ROLES[role].icon}</span>
              Signed in as <strong>{ROLES[role].label}</strong>
              <div className="small text-muted mt-1">{ROLES[role].description}</div>
            </div>
          )}

          <Link href={homeRoute} className="btn btn-primary">
            <i className="bi bi-arrow-left me-1" />
            Go to your home page
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getDefaultRoute } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = (session?.user?.role as UserRole) ?? "cashier";
    router.push(getDefaultRoute(role));
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center justify-content-center p-3">
      <div className="card border-0 shadow login-card w-100">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <i className="bi bi-fuel-pump-fill text-primary display-5" />
            <h1 className="h3 fw-bold mt-2">PumpMetrics</h1>
            <p className="text-muted mb-0">Sign in to your account</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="form-control form-control-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="form-control form-control-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signInAction } from "@/lib/actions/auth";
import FormAlert from "@/components/FormAlert";

const initial = { error: null };

export default function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initial);
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="surface-card p-4 p-md-5" noValidate>
      <h1 className="h3 mb-1">Sign in</h1>
      <p className="text-muted mb-4">
        Use your donor account to update availability and donation dates.
      </p>
      <FormAlert error={state?.error} />
      <div className="mb-3">
        <label className="form-label fw-semibold" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="form-control"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="form-label fw-semibold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="form-control"
          autoComplete="current-password"
          minLength={8}
          required
        />
      </div>
      <button className="btn btn-primary w-100 btn-lg" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="mt-3 mb-0 text-center">
        New donor? <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PK_PHONE_HELP, PK_PHONE_PATTERN } from "@/lib/constants";
import { signUpAction } from "@/lib/actions/auth";
import BloodGroupSelect from "@/components/BloodGroupSelect";
import CitySelect from "@/components/CitySelect";
import FormAlert from "@/components/FormAlert";

const initial = { error: null, info: null };

export default function RegisterForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);

  return (
    <form action={action} className="surface-card p-4 p-md-5" noValidate>
      <h1 className="h3 mb-1">Register as a donor</h1>
      <p className="text-muted mb-4">
        Your phone number stays behind the WhatsApp button. Seekers will never
        see it as plain text.
      </p>
      <FormAlert error={state?.error} info={state?.info} />
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="full_name">
            Full name <span className="text-danger">*</span>
          </label>
          <input id="full_name" name="full_name" className="form-control" required />
        </div>
        <div className="col-md-6">
          <BloodGroupSelect id="reg-blood-group" required />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="email">
            Email <span className="text-danger">*</span>
          </label>
          <input id="email" name="email" type="email" className="form-control" autoComplete="email" required />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="phone_number">
            Phone / WhatsApp <span className="text-danger">*</span>
          </label>
          <input
            id="phone_number"
            name="phone_number"
            className="form-control"
            inputMode="tel"
            pattern={PK_PHONE_PATTERN}
            placeholder="03XXXXXXXXX"
            required
          />
          <div className="form-text">{PK_PHONE_HELP}</div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="alt_phone_number">
            Alternate phone
          </label>
          <input
            id="alt_phone_number"
            name="alt_phone_number"
            className="form-control"
            inputMode="tel"
            pattern={PK_PHONE_PATTERN}
            placeholder="Optional second network"
          />
        </div>
        <div className="col-md-6">
          <CitySelect id="reg-city" required />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="area">
            Area / town / sector <span className="text-danger">*</span>
          </label>
          <input
            id="area"
            name="area"
            className="form-control"
            placeholder="Johar Town, Clifton, DHA, G-11"
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="last_donation_date">
            Last donation date
          </label>
          <input id="last_donation_date" name="last_donation_date" type="date" className="form-control" />
          <div className="form-text">Leave blank if you have never donated.</div>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="password">
            Password <span className="text-danger">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-control"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="confirm_password">
            Confirm password <span className="text-danger">*</span>
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            className="form-control"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </div>
      <button className="btn btn-primary w-100 btn-lg mt-4" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create donor account"}
      </button>
      <p className="mt-3 mb-0 text-center">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}

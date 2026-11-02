"use client";

import { useActionState } from "react";
import { PK_PHONE_HELP, PK_PHONE_PATTERN } from "@/lib/constants";
import { updateProfileAction } from "@/lib/actions/profile";
import { cooldownLabel, donorCurrentlyAvailable } from "@/lib/cooldown";
import BloodGroupSelect from "@/components/BloodGroupSelect";
import CitySelect from "@/components/CitySelect";
import FormAlert from "@/components/FormAlert";

const initial = { error: null, info: null };

export default function ProfileForm({ profile }) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const live = donorCurrentlyAvailable(profile);

  return (
    <form action={action} className="surface-card p-4 p-md-5">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Your donor dashboard</h1>
          <p className="text-muted mb-0">
            Toggle availability or record a donation. The 90-day cooldown hides
            you from search automatically.
          </p>
        </div>
        <span className={`badge rounded-pill align-self-start ${live ? "bg-success" : "bg-secondary"}`}>
          {live ? "Visible to seekers" : "Hidden from search"}
        </span>
      </div>
      <FormAlert error={state?.error} info={state?.info} />
      <div className="alert alert-light border mb-4" role="status">
        {cooldownLabel(profile.last_donation_date)}
      </div>
      <div className="form-check form-switch mb-4">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="is_available"
          name="is_available"
          defaultChecked={profile.is_available}
        />
        <label className="form-check-label fw-semibold" htmlFor="is_available">
          I am available to donate
        </label>
      </div>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            className="form-control"
            defaultValue={profile.full_name}
            required
          />
        </div>
        <div className="col-md-6">
          <BloodGroupSelect
            id="profile-blood-group"
            defaultValue={profile.blood_group}
            required
            includeEmpty={false}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="phone_number">
            Phone / WhatsApp
          </label>
          <input
            id="phone_number"
            name="phone_number"
            className="form-control"
            defaultValue={profile.phone_number}
            pattern={PK_PHONE_PATTERN}
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
            defaultValue={profile.alt_phone_number || ""}
            pattern={PK_PHONE_PATTERN}
          />
        </div>
        <div className="col-md-6">
          <CitySelect id="profile-city" defaultValue={profile.city} required />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="area">
            Area / town / sector
          </label>
          <input
            id="area"
            name="area"
            className="form-control"
            defaultValue={profile.area}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="last_donation_date">
            Last donation date
          </label>
          <input
            id="last_donation_date"
            name="last_donation_date"
            type="date"
            className="form-control"
            defaultValue={profile.last_donation_date || ""}
          />
        </div>
      </div>
      <button className="btn btn-primary mt-4" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

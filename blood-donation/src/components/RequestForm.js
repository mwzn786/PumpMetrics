"use client";

import { useActionState } from "react";
import { URGENCY_LEVELS } from "@/lib/constants";
import { createRequestAction } from "@/lib/actions/requests";
import BloodGroupSelect from "@/components/BloodGroupSelect";
import CitySelect from "@/components/CitySelect";
import FormAlert from "@/components/FormAlert";

const initial = { error: null };

export default function RequestForm() {
  const [state, action, pending] = useActionState(createRequestAction, initial);

  return (
    <form action={action} className="surface-card p-4 p-md-5">
      <h1 className="h3 mb-1">Post an urgent blood request</h1>
      <p className="text-muted mb-4">
        This goes live on the public emergency feed. You do not need an account.
      </p>
      <FormAlert error={state?.error} />
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="requester_name">
            Your name <span className="text-danger">*</span>
          </label>
          <input id="requester_name" name="requester_name" className="form-control" required />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="contact_info">
            WhatsApp or phone <span className="text-danger">*</span>
          </label>
          <input id="contact_info" name="contact_info" className="form-control" required />
        </div>
        <div className="col-md-6">
          <BloodGroupSelect id="req-blood-group" required />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="urgency_level">
            Urgency
          </label>
          <select
            id="urgency_level"
            name="urgency_level"
            className="form-select"
            defaultValue="Urgent"
          >
            {URGENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="hospital_name">
            Hospital <span className="text-danger">*</span>
          </label>
          <input
            id="hospital_name"
            name="hospital_name"
            className="form-control"
            placeholder="Shaukat Khanum, Jinnah Hospital, Aga Khan, PIMS"
            required
          />
        </div>
        <div className="col-md-6">
          <CitySelect id="req-city" required />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold" htmlFor="area">
            Area / town / sector <span className="text-danger">*</span>
          </label>
          <input id="area" name="area" className="form-control" required />
        </div>
        <div className="col-12">
          <label className="form-label fw-semibold" htmlFor="details">
            Details
          </label>
          <textarea
            id="details"
            name="details"
            className="form-control"
            rows={4}
            maxLength={600}
            placeholder="Patient condition, units needed, ward or floor…"
          />
        </div>
      </div>
      <button className="btn btn-primary btn-lg mt-4" type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish request"}
      </button>
    </form>
  );
}

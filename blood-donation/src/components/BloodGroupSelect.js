import { BLOOD_GROUPS } from "@/lib/constants";

export default function BloodGroupSelect({
  id,
  name = "blood_group",
  label = "Blood group",
  required = false,
  defaultValue = "",
  includeEmpty = true,
}) {
  return (
    <div>
      <label className="form-label fw-semibold" htmlFor={id}>
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <select
        id={id}
        name={name}
        className="form-select"
        required={required}
        defaultValue={defaultValue}
        aria-required={required}
      >
        {includeEmpty ? <option value="">Select group</option> : null}
        {BLOOD_GROUPS.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>
    </div>
  );
}

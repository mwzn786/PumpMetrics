import { BLOOD_GROUPS, URGENCY_LEVELS } from "@/lib/constants";
import { isPakistanCity } from "@/lib/cities";
import { isPakistaniMobile } from "@/lib/phone";

function requiredText(value, label, { min = 2, max = 80 } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < min) return `${label} must be at least ${min} characters.`;
  if (trimmed.length > max) return `${label} must be at most ${max} characters.`;
  return null;
}

export function validateBloodGroup(value) {
  if (!BLOOD_GROUPS.includes(value)) {
    return "Choose a valid blood group.";
  }
  return null;
}

export function validateCity(value) {
  if (!isPakistanCity(value)) {
    return "Choose a city from the Pakistan city list.";
  }
  return null;
}

export function validatePhone(value, { optional = false, label = "Phone number" } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return optional ? null : `${label} is required.`;
  if (!isPakistaniMobile(trimmed)) {
    return `${label} must be 03XXXXXXXXX or +923XXXXXXXXX.`;
  }
  return null;
}

export function validateLastDonationDate(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "Use a valid donation date.";
  }
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "Use a valid donation date.";
  }
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (date.getTime() > todayUtc) {
    return "Last donation date cannot be in the future.";
  }
  return null;
}

export function firstError(errors) {
  return errors.find(Boolean) ?? null;
}

export function validateDonorProfile(input) {
  return firstError([
    requiredText(input.full_name, "Full name"),
    validatePhone(input.phone_number, { label: "Phone number" }),
    validatePhone(input.alt_phone_number, {
      optional: true,
      label: "Alternate phone number",
    }),
    validateBloodGroup(input.blood_group),
    validateCity(input.city),
    requiredText(input.area, "Area / town / sector"),
    validateLastDonationDate(input.last_donation_date),
  ]);
}

export function validateAuthCredentials(input) {
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

export function validateBloodRequest(input) {
  return firstError([
    requiredText(input.requester_name, "Your name"),
    requiredText(input.contact_info, "WhatsApp or phone", { min: 5 }),
    validateBloodGroup(input.blood_group),
    requiredText(input.hospital_name, "Hospital name", { max: 120 }),
    validateCity(input.city),
    requiredText(input.area, "Area / town / sector"),
    URGENCY_LEVELS.includes(input.urgency_level)
      ? null
      : "Choose Critical, Urgent, or Routine.",
    String(input.details ?? "").length > 600
      ? "Details must be at most 600 characters."
      : null,
  ]);
}

export function formString(formData, key) {
  return String(formData.get(key) ?? "").trim();
}

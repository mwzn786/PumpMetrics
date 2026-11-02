import { COOLDOWN_DAYS } from "@/lib/constants";

function toUtcDay(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day) return null;
  return Date.UTC(year, month - 1, day);
}

export function daysSinceDonation(lastDonationDate) {
  const last = toUtcDay(lastDonationDate);
  if (last == null) return null;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - last) / 86_400_000);
}

export function isInCooldown(lastDonationDate) {
  const days = daysSinceDonation(lastDonationDate);
  return days != null && days < COOLDOWN_DAYS;
}

export function donorCurrentlyAvailable(profile) {
  if (!profile?.is_available) return false;
  return !isInCooldown(profile.last_donation_date);
}

export function cooldownLabel(lastDonationDate) {
  const days = daysSinceDonation(lastDonationDate);
  if (days == null) return "No donation on record";
  if (days < COOLDOWN_DAYS) {
    const remaining = COOLDOWN_DAYS - days;
    return `Cooldown: ${remaining} day${remaining === 1 ? "" : "s"} remaining`;
  }
  return `Last donated ${days} days ago`;
}

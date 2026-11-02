import { PK_PHONE_REGEX } from "@/lib/constants";

export function isPakistaniMobile(value) {
  return PK_PHONE_REGEX.test(String(value ?? "").trim());
}

/** Convert a Pakistani mobile number into the digits wa.me expects (923XXXXXXXXX). */
export function toWhatsAppE164(phone) {
  const trimmed = String(phone ?? "").trim();
  if (trimmed.startsWith("+92") && /^\+923\d{9}$/.test(trimmed)) {
    return trimmed.slice(1);
  }
  if (/^03\d{9}$/.test(trimmed)) {
    return `92${trimmed.slice(1)}`;
  }
  if (/^923\d{9}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

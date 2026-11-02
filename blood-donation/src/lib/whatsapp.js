import { APP_NAME } from "@/lib/constants";
import { toWhatsAppE164 } from "@/lib/phone";

export function buildWhatsAppMessage({
  donorName,
  bloodGroup,
  city,
  area,
  hospital,
}) {
  const hospitalLine = hospital
    ? ` at ${hospital}`
    : "";
  return [
    `Assalam-o-Alaikum ${donorName || "dear donor"},`,
    "",
    `I found your donor profile on ${APP_NAME}. We urgently need ${bloodGroup} blood${hospitalLine} in ${area}, ${city}. Could you please help, or share this message with someone who can donate?`,
    "",
    "JazakAllah Khair.",
  ].join("\n");
}

export function buildWhatsAppUrl(phone, messageFields) {
  const e164 = toWhatsAppE164(phone);
  if (!e164) return null;
  const text = buildWhatsAppMessage(messageFields);
  return `https://wa.me/${e164}?text=${encodeURIComponent(text)}`;
}

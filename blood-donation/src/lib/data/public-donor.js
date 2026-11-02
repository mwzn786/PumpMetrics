import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Strip phone numbers before they reach the browser. */
export function toPublicDonor(row, extras = {}) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    blood_group: row.blood_group,
    city: row.city,
    area: row.area,
    last_donation_date: row.last_donation_date,
    whatsappUrl: buildWhatsAppUrl(row.phone_number, {
      donorName: row.full_name,
      bloodGroup: extras.bloodGroup || row.blood_group,
      city: row.city,
      area: row.area,
      hospital: extras.hospital || "",
    }),
  };
}

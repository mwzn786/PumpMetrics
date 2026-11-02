"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBloodRequest } from "@/lib/data/requests";
import { formString, validateBloodRequest } from "@/lib/validation";

export async function createRequestAction(_prev, formData) {
  const payload = {
    requester_name: formString(formData, "requester_name"),
    contact_info: formString(formData, "contact_info"),
    blood_group: formString(formData, "blood_group"),
    hospital_name: formString(formData, "hospital_name"),
    city: formString(formData, "city"),
    area: formString(formData, "area"),
    urgency_level: formString(formData, "urgency_level") || "Urgent",
    details: formString(formData, "details") || null,
  };

  const error = validateBloodRequest(payload);
  if (error) return { error };

  try {
    await createBloodRequest(payload);
  } catch (err) {
    return { error: err.message || "Could not publish this request." };
  }

  revalidatePath("/feed");
  redirect("/feed?posted=1");
}

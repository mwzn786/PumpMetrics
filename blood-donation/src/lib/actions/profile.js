"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { updateOwnProfile } from "@/lib/data/donors";
import { formString, validateDonorProfile } from "@/lib/validation";

export async function updateProfileAction(_prev, formData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to update your profile." };

  const is_available = formData.get("is_available") === "on";
  const patch = {
    full_name: formString(formData, "full_name"),
    phone_number: formString(formData, "phone_number"),
    alt_phone_number: formString(formData, "alt_phone_number") || null,
    blood_group: formString(formData, "blood_group"),
    city: formString(formData, "city"),
    area: formString(formData, "area"),
    last_donation_date: formString(formData, "last_donation_date") || null,
    is_available,
  };

  const error = validateDonorProfile(patch);
  if (error) return { error };

  try {
    await updateOwnProfile(user.id, patch);
  } catch (err) {
    return { error: err.message || "Could not save your profile." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/donors");
  revalidatePath("/");
  return { error: null, info: "Profile saved." };
}

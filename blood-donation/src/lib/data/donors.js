import { donorCurrentlyAvailable } from "@/lib/cooldown";
import { getDemoStore, updateDemoStore } from "@/lib/data/demo-store";
import { toPublicDonor } from "@/lib/data/public-donor";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isPakistanCity } from "@/lib/cities";
import { BLOOD_GROUPS } from "@/lib/constants";

export async function searchAvailableDonors({
  bloodGroup,
  city,
  hospital = "",
} = {}) {
  if (!BLOOD_GROUPS.includes(bloodGroup) || !isPakistanCity(city)) {
    return [];
  }

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("available_donors")
      .select("id, full_name, blood_group, city, area, phone_number, last_donation_date")
      .eq("blood_group", bloodGroup)
      .eq("city", city)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) =>
      toPublicDonor(row, { bloodGroup, hospital }),
    );
  }

  const store = await getDemoStore();
  return store.profiles
    .filter(
      (profile) =>
        profile.blood_group === bloodGroup &&
        profile.city === city &&
        donorCurrentlyAvailable(profile),
    )
    .map((profile) => toPublicDonor(profile, { bloodGroup, hospital }));
}

export async function getProfileByUserId(userId) {
  if (!userId) return null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, phone_number, alt_phone_number, blood_group, city, area, is_available, last_donation_date, created_at",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  const store = await getDemoStore();
  return store.profiles.find((profile) => profile.id === userId) ?? null;
}

export async function upsertDemoProfile(profile) {
  return updateDemoStore((store) => {
    const index = store.profiles.findIndex((item) => item.id === profile.id);
    if (index === -1) {
      store.profiles.unshift(profile);
    } else {
      store.profiles[index] = { ...store.profiles[index], ...profile };
    }
    return store.profiles[index] ?? profile;
  });
}

export async function updateOwnProfile(userId, patch) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select(
        "id, full_name, phone_number, alt_phone_number, blood_group, city, area, is_available, last_donation_date, created_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  return updateDemoStore((store) => {
    const index = store.profiles.findIndex((item) => item.id === userId);
    if (index === -1) {
      throw new Error("Profile not found.");
    }
    store.profiles[index] = { ...store.profiles[index], ...patch };
    return store.profiles[index];
  });
}

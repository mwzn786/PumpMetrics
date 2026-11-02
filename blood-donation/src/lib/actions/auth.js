"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE } from "@/lib/constants";
import { getDemoStore, updateDemoStore } from "@/lib/data/demo-store";
import { isSupabaseConfigured, getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  formString,
  validateAuthCredentials,
  validateDonorProfile,
} from "@/lib/validation";

const SESSION_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === "production",
};

function readSignup(formData) {
  return {
    email: formString(formData, "email").toLowerCase(),
    password: formString(formData, "password"),
    confirm_password: formString(formData, "confirm_password"),
    full_name: formString(formData, "full_name"),
    phone_number: formString(formData, "phone_number"),
    alt_phone_number: formString(formData, "alt_phone_number") || null,
    blood_group: formString(formData, "blood_group"),
    city: formString(formData, "city"),
    area: formString(formData, "area"),
    last_donation_date: formString(formData, "last_donation_date") || null,
  };
}

async function setDemoSession(userId) {
  const jar = await cookies();
  jar.set(DEMO_SESSION_COOKIE, userId, SESSION_OPTIONS);
}

async function clearDemoSession() {
  const jar = await cookies();
  jar.delete(DEMO_SESSION_COOKIE);
}

export async function signInAction(_prev, formData) {
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");
  const credentialError = validateAuthCredentials({ email, password });
  if (credentialError) return { error: credentialError };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    redirect("/dashboard");
  }

  const store = await getDemoStore();
  const user = store.users.find((item) => item.email === email);
  if (!user || user.password !== password) {
    return { error: "Invalid email or password." };
  }
  await setDemoSession(user.id);
  redirect("/dashboard");
}

export async function signUpAction(_prev, formData) {
  const input = readSignup(formData);
  const credentialError = validateAuthCredentials(input);
  if (credentialError) return { error: credentialError };
  if (input.password !== input.confirm_password) {
    return { error: "Passwords do not match." };
  }
  const profileError = validateDonorProfile(input);
  if (profileError) return { error: profileError };

  const metadata = {
    full_name: input.full_name,
    phone_number: input.phone_number,
    alt_phone_number: input.alt_phone_number,
    blood_group: input.blood_group,
    city: input.city,
    area: input.area,
    last_donation_date: input.last_donation_date,
  };

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const headerStore = await headers();
    const origin =
      getSiteUrl() ||
      headerStore.get("origin") ||
      `${headerStore.get("x-forwarded-proto") || "http"}://${headerStore.get("host") || ""}`;
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: metadata,
        emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
      },
    });
    if (error) return { error: error.message };

    if (data.user && !data.session) {
      return {
        error: null,
        info: "Check your email to confirm your account, then sign in.",
      };
    }
    redirect("/dashboard");
  }

  const existing = (await getDemoStore()).users.find(
    (item) => item.email === input.email,
  );
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const id = randomUUID();
  await updateDemoStore((store) => {
    store.users.push({
      id,
      email: input.email,
      password: input.password,
      full_name: input.full_name,
    });
    store.profiles.unshift({
      id,
      full_name: input.full_name,
      phone_number: input.phone_number,
      alt_phone_number: input.alt_phone_number,
      blood_group: input.blood_group,
      city: input.city,
      area: input.area,
      is_available: true,
      last_donation_date: input.last_donation_date,
      created_at: new Date().toISOString(),
    });
  });

  await setDemoSession(id);
  redirect("/dashboard");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  await clearDemoSession();
  redirect("/");
}

import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/constants";
import { getDemoStore } from "@/lib/data/demo-store";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) return null;
    return {
      id: claims.sub,
      email: claims.email || "",
      full_name: claims.user_metadata?.full_name || claims.email || "Donor",
      demo: false,
    };
  }

  const jar = await cookies();
  const userId = jar.get(DEMO_SESSION_COOKIE)?.value;
  if (!userId) return null;
  const store = await getDemoStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    demo: true,
  };
}

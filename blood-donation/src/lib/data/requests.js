import { getDemoStore, updateDemoStore } from "@/lib/data/demo-store";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function listBloodRequests() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blood_requests")
      .select(
        "id, requester_name, contact_info, blood_group, hospital_name, city, area, urgency_level, details, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  const store = await getDemoStore();
  return [...store.requests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function createBloodRequest(payload) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blood_requests")
      .insert(payload)
      .select(
        "id, requester_name, contact_info, blood_group, hospital_name, city, area, urgency_level, details, created_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  return updateDemoStore((store) => {
    store.requestSeq += 1;
    const row = {
      id: store.requestSeq,
      ...payload,
      created_at: new Date().toISOString(),
    };
    store.requests.unshift(row);
    return row;
  });
}

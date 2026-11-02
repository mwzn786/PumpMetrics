import { isSupabaseConfigured } from "@/lib/env";

export default function DemoBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="demo-banner py-2" role="status">
      <div className="container">
        Demo mode (no Supabase keys). Search <strong>O+</strong> in{" "}
        <strong>Lahore</strong>, or sign in as <strong>fatima@hayatlink.pk</strong>{" "}
        / <strong>demo12345</strong>.
      </div>
    </div>
  );
}

import { Suspense } from "react";
import AccessDenied from "@/components/AccessDenied";

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      }
    >
      <AccessDenied />
    </Suspense>
  );
}

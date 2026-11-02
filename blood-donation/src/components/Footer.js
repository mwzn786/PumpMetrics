import Link from "next/link";
import { APP_NAME, COOLDOWN_DAYS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="site-footer py-4 mt-auto">
      <div className="container d-flex flex-column flex-md-row justify-content-between gap-3">
        <p className="mb-0">
          {APP_NAME} is a community blood matching service for Pakistan. It is
          not a hospital, blood bank, or replacement for emergency services.
          Call <a href="tel:1122">1122</a> in a medical emergency.
        </p>
        <p className="mb-0">
          Donors stay hidden for {COOLDOWN_DAYS} days after a donation.{" "}
          <Link href="/register">Become a donor</Link>
        </p>
      </div>
    </footer>
  );
}

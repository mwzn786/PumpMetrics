import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUserId } from "@/lib/data/donors";

export const metadata = {
  title: "Donor dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfileByUserId(user.id);

  if (!profile) {
    return (
      <div className="page-shell">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="alert alert-warning">
            Your account exists, but the donor profile is not ready yet. Finish
            registration or contact support if you already submitted one.
          </div>
          <Link href="/register">Go to registration</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 880 }}>
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}

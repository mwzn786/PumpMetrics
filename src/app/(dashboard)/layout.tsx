import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}

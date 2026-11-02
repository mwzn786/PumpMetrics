import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 520 }}>
        <LoginForm />
      </div>
    </div>
  );
}

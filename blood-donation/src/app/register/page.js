import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Register",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="page-shell">
      <div className="container" style={{ maxWidth: 880 }}>
        <RegisterForm />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";

import LoginForm from "@/components/admin/LoginForm";
import { hasValidSessionFromCookies } from "@/lib/adminAuth";

export default function AdminLoginPage() {
  if (hasValidSessionFromCookies()) {
    redirect("/admin");
  }

  return (
    <div className="admin-auth">
      <h1>Admin Access</h1>
      <p>Enter the password shared in your deployment notes.</p>
      <LoginForm />
    </div>
  );
}

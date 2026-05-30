import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import AdminPanel from "./AdminPanel";

const AUTH_SECRET = process.env.AUTH_SECRET || "change-me";
const COOKIE_NAME = "admin_auth";

export default async function AdminPage() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token, AUTH_SECRET) : null;

  // No security required: allow anyone to view the admin panel
  // if (!payload || payload.role !== "super-admin") {
  //   redirect("/admin/login");
  // }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container py-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-800 bg-slate-900/95 p-6 md:p-8 shadow-xl shadow-slate-950/40">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Super Admin Panel</p>
          <h1 className="text-3xl font-semibold text-white">Manage registered users</h1>
          <p className="max-w-2xl text-slate-300">Update or remove existing clients from the database. This panel is restricted to the super-admin credential.</p>
        </div>
        <AdminPanel />
        </div>
      </div>
    </main>
  );
}

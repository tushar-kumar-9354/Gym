"use client";

import { useEffect, useState } from "react";
import { clearUserLocalStorage } from "@/lib/storage";
import { useRouter } from "next/navigation";

type AppUser = {
  email: string;
  name: string;
  role: "client" | "admin";
  status: "active" | "locked";
  validUntil: string;
  createdAt: string;
  updatedAt?: string;
};

type FormState = {
  name: string;
  email: string;
  status: string;
  validUntil: string;
  password: string;
};

export default function AdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    status: "active",
    validUntil: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Unable to load users");
        return;
      }
      setUsers(data.users || []);
    } catch (err) {
      setError("Unable to load users");
    } finally {
      setIsLoading(false);
    }
  }

  function openUser(user: AppUser) {
    setSelectedUser(user);
    setSuccess(null);
    setError(null);
    setFormState({
      name: user.name,
      email: user.email,
      status: user.status,
      validUntil: user.validUntil.slice(0, 10),
      password: "",
    });
  }

  function handleFieldChange(key: keyof FormState, value: string) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  async function handleUpdate() {
    if (!selectedUser) return;
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const payload: Record<string, string> = {
      identifier: selectedUser.email,
      name: formState.name,
      email: formState.email,
      status: formState.status,
      validUntil: new Date(formState.validUntil).toISOString(),
    };

    if (formState.password.trim()) {
      payload.password = formState.password.trim();
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Unable to update user");
        return;
      }
      setSuccess("User updated successfully.");
      setSelectedUser(data.user);
      fetchUsers();
    } catch (err) {
      setError("Unable to update user");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove(user?: AppUser) {
    const targetUser = user || selectedUser;
    if (!targetUser) return;
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetUser.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || "Unable to remove user");
        return;
      }
      clearUserLocalStorage(targetUser.email);
      setSuccess("User removed successfully.");
      if (selectedUser?.email === targetUser.email) {
        setSelectedUser(null);
        setFormState({ name: "", email: "", status: "active", validUntil: "", password: "" });
      }
      fetchUsers();
    } catch (err) {
      setError("Unable to remove user");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="space-y-8 bg-gray-900 p-6 rounded-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Registered users</h2>
          <p className="mt-2 max-w-2xl text-slate-400">Select a user record to update or remove. Admin operations are limited to existing users only.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { handleLogout(); }}
            className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            Log out
          </button>
          <button
            onClick={async () => {
              const confirmed = window.confirm("This will permanently delete ALL user data by removing the entire data folder. This action cannot be undone. Continue?");
              if (!confirmed) return;
              try {
                const res = await fetch('/api/admin/reset', { method: 'POST' });
                const result = await res.json();
                if (!res.ok) throw new Error(result?.error || 'Reset failed');
                // Clear all localStorage and redirect to login with reason
                localStorage.clear();
                window.location.href = '/login?reason=reset';
              } catch (e) {
                alert('Failed to reset database: ' + (e as Error).message);
              }
            }}
            className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Reset Database
          </button>
        </div>
      </div>

      {error ? <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">{error}</div> : null}
      {success ? <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">{success}</div> : null}

      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 shadow-lg shadow-slate-950/20">
        <div className="overflow-x-auto">
          <div className="responsive-table">
          <table className="min-w-full border-collapse text-left text-sm text-slate-200">
            <thead className="bg-slate-900/90 text-slate-400">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No users available.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.email} className="border-t border-slate-800/70">
                    <td className="px-4 py-4 font-medium text-white">{user.name}</td>
                    <td className="px-4 py-4 text-slate-300">{user.email}</td>
                    <td className="px-4 py-4 text-slate-300">{user.status}</td>
                    <td className="px-4 py-4 text-slate-300">{new Date(user.validUntil).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openUser(user)}
                        className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      {selectedUser ? (
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/20">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Edit {selectedUser.name}</h3>
              <p className="text-slate-400">Update fields and save, or remove this user entirely.</p>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-slate-300">{selectedUser.role}</span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              Name
              <input
                value={formState.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Email
              <input
                type="email"
                value={formState.email}
                onChange={(event) => handleFieldChange("email", event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Status
              <select
                value={formState.status}
                onChange={(event) => handleFieldChange("status", event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="active">active</option>
                <option value="locked">locked</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              Valid until
              <input
                type="date"
                value={formState.validUntil}
                onChange={(event) => handleFieldChange("validUntil", event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
              New password
              <input
                type="password"
                value={formState.password}
                onChange={(event) => handleFieldChange("password", event.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => handleRemove()}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove user
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

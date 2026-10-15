"use client";

import { useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import useAuthStore from "@/modules/auth/auth.store";

const formatLastLogin = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
    || user?.username
    || "Not provided";
  const role = user?.roleName
    || user?.roles?.map((item) => typeof item === "string" ? item : item.roleName).filter(Boolean).join(", ")
    || "Not provided";
  const lastLogin = formatLastLogin(user?.lastLoginDateTime);

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const currentPassword = String(fields.get("currentPassword") ?? "");
    const newPassword = String(fields.get("newPassword") ?? "");
    const confirmPassword = String(fields.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setPasswordError("The new password and confirmation do not match.");
      setPasswordSuccess(null);
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await updatePassword({ currentPassword, newPassword, confirmPassword });
      form.reset();
      setPasswordSuccess("Password changed successfully.");
      setChangingPassword(false);
    } catch (error: unknown) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
        <h1 className="mt-0.5 text-2xl font-bold text-slate-900">Profile &amp; security</h1>
        <p className="mt-1 text-sm text-slate-500">{role}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-bold text-slate-900">Account details</h2>
          <dl className="mt-4 divide-y divide-slate-100">
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">Full name</dt>
              <dd className="text-right text-sm font-semibold text-slate-900">{fullName}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">Role</dt>
              <dd className="text-right text-sm font-semibold text-slate-900">{role}</dd>
            </div>
            {user?.email && (
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-sm text-slate-500">Email</dt>
                <dd className="break-all text-right text-sm font-semibold text-slate-900">{user.email}</dd>
              </div>
            )}
            {user?.username && (
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-sm text-slate-500">Username</dt>
                <dd className="text-right text-sm font-semibold text-slate-900">{user.username}</dd>
              </div>
            )}
            {(user?.phone || user?.phoneNumber) && (
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-sm text-slate-500">Phone</dt>
                <dd className="text-right text-sm font-semibold text-slate-900">{user.phone || user.phoneNumber}</dd>
              </div>
            )}
            {user?.id !== undefined && user.id !== null && (
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-sm text-slate-500">User ID</dt>
                <dd className="text-right text-sm font-semibold text-slate-900">{user.id}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Security</h2>
              <p className="mt-1 text-sm text-slate-500">Manage your account password.</p>
            </div>
            <LockKeyhole className="mt-0.5 size-5 text-slate-500" aria-hidden="true" />
          </div>

          {changingPassword ? (
            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Current password
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                New password
                <input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-700">
                Confirm new password
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              {passwordError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {passwordError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={savingPassword}
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordError(null);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {savingPassword ? "Saving…" : "Save password"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-5 border-t border-slate-100 pt-4">
              {passwordError && (
                <p role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p role="status" className="mb-3 text-sm text-emerald-700">{passwordSuccess}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setChangingPassword(true);
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Change password
              </button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900">Recent sign-in activity</h2>
          {lastLogin ? (
            <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-700">Last sign-in</p>
              <time className="text-sm text-slate-500" dateTime={user?.lastLoginDateTime}>
                {lastLogin}
              </time>
            </div>
          ) : (
            <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
              No sign-in activity is available for this account.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

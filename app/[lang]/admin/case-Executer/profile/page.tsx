"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import useAuthStore from "@/modules/auth/auth.store";

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

const formatDateTime = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function CaseExecutorProfilePage() {
  const params = useParams();
  const pathname = usePathname();
  const lang = typeof params.lang === "string" ? params.lang : "en";
  const user = useAuthStore((state) => state.user);
  const refreshAccountProfile = useAuthStore((state) => state.refreshAccountProfile);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const account = hydrated ? user : null;
  const hasUser = Boolean(user);
  const fullName =
    [account?.firstName, account?.lastName].filter(Boolean).join(" ") ||
    account?.username ||
    "Not provided";
  const role =
    account?.roleName ||
    account?.roles
      ?.map((item) => (typeof item === "string" ? item : item.roleName))
      .filter(Boolean)
      .join(", ") ||
    (account ? "Not provided" : "Sign in to view your profile");
  const lastLogin = formatDateTime(account?.lastLoginDateTime);

  useEffect(() => {
    if (!hydrated || !hasUser) return;
    let active = true;
    void refreshAccountProfile()
      .then(() => {
        if (active) setProfileError(null);
      })
      .catch((error: unknown) => {
        if (active) {
          setProfileError(
            error instanceof Error ? error.message : "Unable to load your account profile.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [hasUser, hydrated, refreshAccountProfile]);

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
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Profile &amp; security</h1>
        <p className="mt-1 text-base text-slate-500">{role}</p>
      </header>

      {profileError && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {profileError}
        </p>
      )}

      {!account && hydrated ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-700">Sign in to view your account details.</p>
          <Link
            href={`/${lang}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="mt-4 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Sign in
          </Link>
        </section>
      ) : (
        <>
          <div className="space-y-6">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <h2 className="border-b border-slate-200 px-5 py-4 text-base font-semibold text-slate-900 sm:px-6">
                Account details
              </h2>
              <dl className="divide-y divide-slate-100 px-5 sm:px-6">
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-500">Full name</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">{fullName}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-500">Role</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">{role}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-500">Branch</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">{account?.branch || "Not provided"}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-500">User ID</dt>
                  <dd className="text-right text-sm font-semibold text-slate-900">{account?.id ?? "Not provided"}</dd>
                </div>
                {account?.email && (
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-sm text-slate-500">Email</dt>
                    <dd className="break-all text-right text-sm font-semibold text-slate-900">{account.email}</dd>
                  </div>
                )}
                {(account?.phone || account?.phoneNumber) && (
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-sm text-slate-500">Phone</dt>
                    <dd className="text-right text-sm font-semibold text-slate-900">{account.phone || account.phoneNumber}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Security</h2>
                  <p className="mt-1 text-sm text-slate-500">Account security information</p>
                </div>
                <LockKeyhole className="mt-0.5 size-5 text-slate-500" aria-hidden="true" />
              </div>

              <dl className="divide-y divide-slate-100 px-5 sm:px-6">
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-700">Two-factor authentication (SMS OTP)</dt>
                  <dd className="text-right text-sm text-slate-500">Not provided</dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-700">Session timeout</dt>
                  <dd className="text-right text-sm text-slate-500">Not provided</dd>
                </div>
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-700">Active sessions</dt>
                  <dd className="text-right text-sm text-slate-500">Not provided</dd>
                </div>
              </dl>

              {changingPassword ? (
                <form onSubmit={(event) => void handlePasswordSubmit(event)} className="mx-5 mb-5 mt-4 space-y-4 border-t border-slate-100 pt-4 sm:mx-6">
                  <label className="block text-xs font-semibold text-slate-700">
                    Current password
                    <input name="currentPassword" type="password" autoComplete="current-password" required className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    New password
                    <input name="newPassword" type="password" autoComplete="new-password" required minLength={8} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Confirm new password
                    <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </label>
                  {passwordError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{passwordError}</p>}
                  <div className="flex justify-end gap-2">
                    <button type="button" disabled={savingPassword} onClick={() => { setChangingPassword(false); setPasswordError(null); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={savingPassword} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{savingPassword ? "Saving…" : "Save password"}</button>
                  </div>
                </form>
              ) : (
                <div className="mx-5 mb-5 mt-4 border-t border-slate-100 pt-4 sm:mx-6">
                  {passwordError && <p role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{passwordError}</p>}
                  {passwordSuccess && <p role="status" className="mb-3 text-sm text-emerald-700">{passwordSuccess}</p>}
                  <button type="button" onClick={() => { setPasswordError(null); setPasswordSuccess(null); setChangingPassword(true); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Change password</button>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <h2 className="border-b border-slate-200 px-5 py-4 text-base font-semibold text-slate-900 sm:px-6">
                Recent sign-in activity
              </h2>
              {lastLogin ? (
                <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-sm text-slate-700">Last sign-in</p>
                  <time className="text-sm text-slate-500" dateTime={account?.lastLoginDateTime}>
                    {lastLogin}
                  </time>
                </div>
              ) : (
                <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">
                  No sign-in activity is available for this account.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}

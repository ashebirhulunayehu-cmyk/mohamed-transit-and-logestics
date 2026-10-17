"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import AssessorProfileEditor from "@/features/profile/components/AssessorProfileEditor";
import useAuthStore from "@/modules/auth/auth.store";

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

type AuthUserWithRole = {
  roleName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

export default function ProfilePage() {
  const [profileError, setProfileError] = useState<string | null>(null);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const authUser = useAuthStore((state) => state.user) as AuthUserWithRole | null;
  const refreshAccountProfile = useAuthStore((state) => state.refreshAccountProfile);
  const roleLabel = hydrated ? authUser?.roleName || "Assessment User" : "Assessment User";
  const fullName = hydrated
    ? [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ") || authUser?.username || "User"
    : "User";

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    void refreshAccountProfile().catch((error: unknown) => {
      if (active) {
        setProfileError(
          error instanceof Error ? error.message : "Unable to load your account profile.",
        );
      }
    });
    return () => {
      active = false;
    };
  }, [hydrated, refreshAccountProfile]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
        <h1 className="text-2xl font-bold text-slate-900">Profile & security</h1>
        <p className="text-sm text-slate-500">{fullName} · {roleLabel}</p>
      </div>

      {profileError && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {profileError}
        </p>
      )}
      {hydrated && <AssessorProfileEditor />}
    </div>
  );
}
"use client";

import AssessorProfileEditor from "@/features/profile/components/AssessorProfileEditor";
import useAuthStore from "@/modules/auth/auth.store";

type AuthUserWithRole = {
  roleName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

export default function ProfilePage() {
  const authUser = useAuthStore((state) => state.user) as AuthUserWithRole | null;
  const roleLabel = authUser?.roleName || "Assessment User";
  const fullName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ") || authUser?.username || "User";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
        <h1 className="text-2xl font-bold text-slate-900">Profile & security</h1>
        <p className="text-sm text-slate-500">{fullName} · {roleLabel}</p>
      </div>

        <AssessorProfileEditor />
    </div>
  );
}
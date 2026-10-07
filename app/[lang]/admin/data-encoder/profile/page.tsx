"use client";

import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";
import {
  AccountDetailsCard,
  RecentActivityList,
  SecurityControlsCard,
} from "@/features/profile";
import useAuthStore from "@/modules/auth/auth.store";

export default function DataEncoderProfilePage() {
  const authUser = useAuthStore((state) => state.user) as {
    roleName?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  } | null;
  const fullName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ") || authUser?.username || "User";
  const roleLabel = authUser?.roleName || "Data Encoder";

  return (
    <EncoderSectionLayout
      activeSection="profile"
      title="Profile"
      description="Manage your identity, account details, and security controls."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Profile & security</h2>
          <p className="mt-1 text-sm text-slate-500">{fullName} · {roleLabel}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AccountDetailsCard />
          <SecurityControlsCard />
        </div>

        <RecentActivityList />
      </div>
    </EncoderSectionLayout>
  );
}

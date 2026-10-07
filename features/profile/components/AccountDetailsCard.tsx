"use client";

import useAuthStore from "@/modules/auth/auth.store";
import { useProfileStore } from "../profile.store";

type AuthUserWithRole = {
  roleName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  id?: string | number;
};

export default function AccountDetailsCard() {
  const authUser = useAuthStore((state) => state.user) as AuthUserWithRole | null;
  const { fullName, role, branch, userId } = useProfileStore();

  const resolvedFullName = authUser?.firstName || authUser?.lastName
    ? `${authUser?.firstName || ""} ${authUser?.lastName || ""}`.trim()
    : authUser?.username || fullName;

  const resolvedRole = authUser?.roleName || role;
  const resolvedUserId = authUser?.id ? String(authUser.id) : userId;

  const details = [
    { label: "Full name", value: resolvedFullName },
    { label: "Role", value: resolvedRole },
    { label: "Branch", value: branch },
    { label: "User ID", value: resolvedUserId },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-900 mb-4">Account details</h3>
      <div className="divide-y divide-slate-100">
        {details.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-3.5">
            <span className="text-sm text-slate-500">{item.label}</span>
            <span className="text-sm font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
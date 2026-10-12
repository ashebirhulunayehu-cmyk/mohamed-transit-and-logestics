"use client";

import useAuthStore from "@/modules/auth/auth.store";

type AuthUserWithRole = {
  roleName?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  id?: string | number;
};

export interface AccountDetails {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: string;
  branch?: string;
  userId?: string;
  email?: string;
  phone?: string;
  username?: string;
  profilePictureUrl?: string;
}

interface AccountDetailsCardProps {
  profile?: AccountDetails;
}

export default function AccountDetailsCard({ profile }: AccountDetailsCardProps) {
  const authUser = useAuthStore((state) => state.user) as AuthUserWithRole | null;

  const resolvedFullName = authUser?.firstName || authUser?.lastName
    ? `${authUser?.firstName || ""} ${authUser?.lastName || ""}`.trim()
    : authUser?.username || "Not provided";

  const resolvedRole = authUser?.roleName || "Not provided";
  const resolvedUserId = authUser?.id ? String(authUser.id) : "Not provided";

  const details = [
    { label: "Full name", value: profile?.fullName || resolvedFullName },
    { label: "Role", value: profile?.role || resolvedRole },
    { label: "Branch", value: profile?.branch || "Not provided" },
    { label: "User ID", value: profile?.userId || resolvedUserId },
    ...(profile?.email ? [{ label: "Email", value: profile.email }] : []),
    ...(profile?.phone ? [{ label: "Phone", value: profile.phone }] : []),
    ...(profile?.username ? [{ label: "Username", value: profile.username }] : []),
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
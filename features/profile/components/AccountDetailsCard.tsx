"use client";

import { useProfileStore } from "../profile.store";

export default function AccountDetailsCard() {
  const { fullName, role, branch, userId } = useProfileStore();

  const details = [
    { label: "Full name", value: fullName },
    { label: "Role", value: role },
    { label: "Branch", value: branch },
    { label: "User ID", value: userId },
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
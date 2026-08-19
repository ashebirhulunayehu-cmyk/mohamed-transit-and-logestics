"use client";

import { useProfileStore } from "../profile.store";

export default function RecentActivityList() {
  const { activities } = useProfileStore();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Recent sign-in activity</h3>
      <div className="divide-y divide-slate-100">
        {activities.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <span className="font-medium text-slate-900">{item.action}</span>
              <span className="text-slate-500"> — {item.detail}</span>
            </div>
            <span className="text-xs text-slate-400 shrink-0 ml-4">{item.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
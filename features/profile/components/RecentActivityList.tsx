"use client";

export default function RecentActivityList() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Recent sign-in activity</h3>
      <p className="text-sm text-slate-500">No recent sign-in activity is available.</p>
    </div>
  );
}
"use client";

import useAuthStore from "@/modules/auth/auth.store";

export default function SecurityControlsCard() {
  const authUser = useAuthStore((state) => state.user);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900">Security</h3>
        <p className="text-xs text-slate-500 mb-4">Banking-grade controls</p>

        <div className="space-y-4 divide-y divide-slate-100">
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-slate-700">Two-factor authentication (SMS OTP)</span>
            <button
              type="button"
              aria-pressed={false}
              disabled
              className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
            >
              Not configured
            </button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-slate-700">Session timeout</span>
            <span className="text-sm text-slate-600">Managed by your organization</span>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-slate-700">Recovery email</span>
            <span className="text-sm text-slate-600">{authUser?.email || "Not provided"}</span>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-slate-700">Active sessions</span>
            <span className="text-sm text-slate-600">Unavailable</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          type="button"
          disabled
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 opacity-60"
        >
          Change password
        </button>
      </div>
    </div>
  );
}
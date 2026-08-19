"use client";

import { useProfileStore } from "../profile.store";

export default function SecurityControlsCard() {
  const { twoFactorEnabled, sessionTimeout, revokeOtherSessions } = useProfileStore();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900">Security</h3>
        <p className="text-xs text-slate-500 mb-4">Banking-grade controls</p>

        <div className="space-y-4 divide-y divide-slate-100">
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-slate-700">Two-factor authentication (SMS OTP)</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-slate-700">Session timeout</span>
            <span className="text-sm text-slate-600">{sessionTimeout}</span>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-slate-700">Active sessions</span>
            <button
              type="button"
              onClick={revokeOtherSessions}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              Revoke others
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          Change password
        </button>
      </div>
    </div>
  );
}
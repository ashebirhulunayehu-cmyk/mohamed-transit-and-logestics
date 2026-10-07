"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Pencil, Save, X } from "lucide-react";
import useAuthStore from "@/modules/auth/auth.store";

export default function AssessorProfileEditor() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) {
      setError("Your account ID is unavailable. Sign in again before updating your profile.");
      return;
    }

    const fields = new FormData(event.currentTarget);
    const firstName = String(fields.get("firstName") ?? "").trim();
    const lastName = String(fields.get("lastName") ?? "").trim();
    const email = String(fields.get("email") ?? "").trim();
    if (!firstName || !lastName || !email) {
      setError("First name, last name, and email are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile({
        id: user.id,
        firstName,
        lastName,
        email,
        username: user.username || email,
      });
      setSuccess("Profile updated successfully.");
      setEditing(false);
    } catch (updateError: unknown) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Assessor account</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Profile details</h2>
          <p className="mt-1 text-sm text-slate-500">Update the account name and email used across the portal.</p>
        </div>
        {!editing && (
          <button type="button" onClick={() => { setError(null); setSuccess(null); setEditing(true); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
            <Pencil className="h-3.5 w-3.5" /> Edit profile
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              First name
              <input name="firstName" required maxLength={100} defaultValue={user?.firstName ?? ""} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Last name
              <input name="lastName" required maxLength={100} defaultValue={user?.lastName ?? ""} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
              Email
              <input name="email" type="email" required maxLength={200} defaultValue={user?.email ?? ""} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
          </div>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" disabled={saving} onClick={() => setEditing(false)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div><p className="text-xs text-slate-500">Name</p><p className="mt-1 text-sm font-semibold text-slate-900">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "—"}</p></div>
          <div><p className="text-xs text-slate-500">Email</p><p className="mt-1 break-all text-sm font-semibold text-slate-900">{user?.email || "—"}</p></div>
          {success && <p role="status" className="flex items-center gap-2 text-xs text-emerald-700 sm:col-span-2"><CheckCircle2 className="h-4 w-4" />{success}</p>}
        </div>
      )}
    </section>
  );
}
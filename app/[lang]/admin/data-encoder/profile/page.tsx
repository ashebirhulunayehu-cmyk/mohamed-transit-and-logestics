"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { Pencil, Save, X } from "lucide-react";
import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";
import {
  AccountDetailsCard,
  RecentActivityList,
  SecurityControlsCard,
} from "@/features/profile";
import type { AccountDetails } from "@/features/profile/components/AccountDetailsCard";
import { DataEncoderEndpoints } from "@/modules/dataencoder/data-encoder.endpoint";
import useAuthStore from "@/modules/auth/auth.store";
import { resolveApiAssetUrl } from "@/modules/utils/asset-url";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (...values: unknown[]): string => {
  const value = values.find(
    (candidate) =>
      (typeof candidate === "string" || typeof candidate === "number") &&
      String(candidate).trim(),
  );
  return value === undefined ? "" : String(value).trim();
};

const readProfilePhotoUrl = (value: Record<string, unknown>): string =>
  readText(
    value.profilePictureUrl,
    value.ProfilePictureUrl,
    value.profilePhotoUrl,
    value.ProfilePhotoUrl,
    value.profilePhoto,
    value.ProfilePhoto,
    value.avatarUrl,
    value.AvatarUrl,
    value.imageUrl,
    value.ImageUrl,
  );

const unwrapProfile = (value: unknown): Record<string, unknown> => {
  let current = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (!isRecord(current)) {
      throw new Error("The Account/GetProfile response did not contain a profile record.");
    }
    const profile = current.profile ?? current.user ?? current.account;
    if (isRecord(profile)) {
      current = profile;
      continue;
    }
    const wrapper = current.data ?? current.payload ?? current.response ?? current.result;
    if (wrapper !== undefined && wrapper !== current) {
      current = wrapper;
      continue;
    }
    return current;
  }
  throw new Error("The Account/GetProfile response nesting is invalid.");
};

const normalizeProfile = (value: Record<string, unknown>): AccountDetails => {
  const fullName = readText(value.fullName, value.FullName, value.name, value.Name);
  const [nameFirst = "", ...nameRest] = fullName.split(/\s+/).filter(Boolean);
  const firstName = readText(value.firstName, value.FirstName) || nameFirst;
  const lastName = readText(value.lastName, value.LastName) || nameRest.join(" ");
  const role = readText(value.roleName, value.RoleName, value.role, value.Role);

  return {
    firstName,
    lastName,
    fullName: fullName || [firstName, lastName].filter(Boolean).join(" "),
    role: typeof value.role === "object" && isRecord(value.role)
      ? readText(value.role.name, value.role.roleName)
      : role,
    branch: readText(value.branch, value.branchName, value.organizationName),
    userId: readText(value.userId, value.id, value.accountId),
    email: readText(value.email, value.Email),
    phone: readText(value.phone, value.phoneNumber, value.PhoneNumber),
    username: readText(value.username, value.userName, value.Username),
    profilePictureUrl: readProfilePhotoUrl(value),
  };
};

export default function DataEncoderProfilePage() {
  const authUser = useAuthStore((state) => state.user) as {
    roleName?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    phone?: string;
    profilePhoto?: string;
    profilePictureUrl?: string;
  } | null;
  const fullName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ") || authUser?.username || "User";
  const roleLabel = authUser?.roleName || "Data Encoder";
  const syncProfile = useAuthStore((state) => state.syncProfile);
  const [profile, setProfile] = useState<AccountDetails>();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const profileName = profile?.fullName || fullName;
  const profileInitials =
    profileName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
  const profilePhotoUrl = resolveApiAssetUrl(
    profile?.profilePictureUrl || authUser?.profilePictureUrl || authUser?.profilePhoto,
  );

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await DataEncoderEndpoints.getProfile();
      const body: unknown = response.status === 204 ? null : await response.json();
      if (!response.ok) {
        const message = isRecord(body) && typeof body.error === "string"
          ? body.error
          : `Profile request failed (${response.status}).`;
        throw new Error(message);
      }
      const normalizedProfile = normalizeProfile(unwrapProfile(body));
      setProfile(normalizedProfile);
      syncProfile({
        ...(normalizedProfile.firstName ? { firstName: normalizedProfile.firstName } : {}),
        ...(normalizedProfile.lastName ? { lastName: normalizedProfile.lastName } : {}),
        ...(normalizedProfile.email ? { email: normalizedProfile.email } : {}),
        ...(normalizedProfile.phone ? { phone: normalizedProfile.phone } : {}),
        ...(normalizedProfile.role ? { roleName: normalizedProfile.role } : {}),
        ...(normalizedProfile.profilePictureUrl
          ? { profilePhoto: normalizedProfile.profilePictureUrl, profilePictureUrl: normalizedProfile.profilePictureUrl }
          : {}),
      });
    } catch (error: unknown) {
      setProfileError(
        error instanceof Error ? error.message : "Unable to load your account profile.",
      );
    } finally {
      setProfileLoading(false);
    }
  }, [syncProfile]);

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim();
    const selectedPhoto = formData.get("profilePhotoFile");
    const profilePhotoFile =
      selectedPhoto instanceof File && selectedPhoto.size > 0
        ? selectedPhoto
        : undefined;

    if (!firstName || !lastName || !email || !username) {
      setUpdateError("First name, last name, username, and email are required.");
      return;
    }

    setSaving(true);
    setUpdateError(null);
    setUpdateSuccess(null);
    try {
      const response = await DataEncoderEndpoints.updateProfile({
        firstName,
        lastName,
        email,
        phone,
        username,
        profilePhotoFile,
      });
      const body: unknown = response.status === 204 ? null : await response.json();
      if (
        !response.ok ||
        (isRecord(body) &&
          (body.error === true ||
            body.isError === true ||
            (typeof body.statusCode === "number" && body.statusCode >= 400)))
      ) {
        const message = isRecord(body) && typeof body.message === "string"
          ? body.message
          : isRecord(body) && typeof body.error === "string"
            ? body.error
            : `Profile update failed (${response.status}).`;
        throw new Error(message);
      }

      setUpdateSuccess("Profile updated successfully.");
      setEditing(false);
      const previewUrl = profilePhotoFile
        ? URL.createObjectURL(profilePhotoFile)
        : undefined;
      if (previewUrl) {
        setProfile((current) => ({ ...current, profilePictureUrl: previewUrl }));
        syncProfile(
          { profilePhoto: previewUrl, profilePictureUrl: previewUrl },
          { persist: false },
        );
      }
      await loadProfile();
      const savedName = [firstName, lastName].filter(Boolean).join(" ");
      setProfile((current) => ({
        ...current,
        firstName,
        lastName,
        fullName: savedName,
        email,
        phone,
        username,
        ...(previewUrl ? { profilePictureUrl: previewUrl } : {}),
      }));
      syncProfile({ firstName, lastName, email, phone, username });
      if (previewUrl) {
        syncProfile(
          { profilePhoto: previewUrl, profilePictureUrl: previewUrl },
          { persist: false },
        );
      }
    } catch (error: unknown) {
      setUpdateError(
        error instanceof Error ? error.message : "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProfile();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadProfile]);

  return (
    <EncoderSectionLayout
      activeSection="profile"
      title="Profile"
      description="Manage your identity, account details, and security controls."
      profilePhotoUrl={profilePhotoUrl}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-lg font-bold text-blue-700 ring-4 ring-blue-50">
                {profileInitials}
                {profilePhotoUrl && (
                  <Image
                    key={profilePhotoUrl}
                    src={profilePhotoUrl}
                    width={64}
                    height={64}
                    alt={`${profileName} profile`}
                    unoptimized
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Profile & security</h2>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {profileName} · {profile?.role || roleLabel}
                </p>
              </div>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setUpdateError(null);
                  setUpdateSuccess(null);
                  setEditing(true);
                }}
                disabled={profileLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </button>
            )}
          </div>
        </div>

        {profileError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <span>Could not load the latest profile: {profileError}</span>
            <button
              type="button"
              onClick={() => void loadProfile()}
              disabled={profileLoading}
              className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 disabled:opacity-60"
            >
              Retry
            </button>
          </div>
        )}

        {updateSuccess && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {updateSuccess}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {editing ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Edit profile details</h3>
              <p className="mt-1 text-sm text-slate-500">Update the account name and contact information.</p>
              <form onSubmit={handleProfileUpdate} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-700">
                    First name
                    <input
                      name="firstName"
                      required
                      maxLength={100}
                      defaultValue={profile?.firstName || authUser?.firstName || ""}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Last name
                    <input
                      name="lastName"
                      required
                      maxLength={100}
                      defaultValue={profile?.lastName || authUser?.lastName || ""}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                    Username
                    <input
                      name="username"
                      required
                      maxLength={100}
                      defaultValue={profile?.username || authUser?.username || ""}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={200}
                      defaultValue={profile?.email || authUser?.email || ""}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                    Profile photo
                    <input
                      name="profilePhotoFile"
                      type="file"
                      accept="image/*"
                      className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700"
                    />
                    <span className="mt-1 block font-normal text-slate-500">
                      Optional. Leave empty to keep the current photo.
                    </span>
                  </label>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                    Phone
                    <input
                      name="phone"
                      type="tel"
                      maxLength={40}
                      defaultValue={profile?.phone || authUser?.phone || ""}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
                {updateError && (
                  <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {updateError}
                  </p>
                )}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setEditing(false);
                      setUpdateError(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <AccountDetailsCard profile={profile} />
          )}
          <SecurityControlsCard />
        </div>

        <RecentActivityList />
      </div>
    </EncoderSectionLayout>
  );
}

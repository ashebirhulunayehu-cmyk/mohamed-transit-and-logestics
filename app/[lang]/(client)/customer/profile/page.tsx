"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Mail, MapPin, Phone, UserRound, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { CustomerPageHeader } from "@/features/customer/components/CustomerPageHeader";
import useAuthStore, { hasCustomerAccount } from "@/modules/auth/auth.store";
import { useCustomerServiceStore } from "@/modules/customer/customer.store";
import {
  getCustomerAccountProfile,
  updateCustomerProfile,
} from "@/modules/customer/customer.endpoint";

// Validation Schema for Password Update
const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "የቀድሞ ይለፍ ቃል ያስገቡ / Current password is required"),
    newPassword: z
      .string()
      .min(6, "አዲሱ ይለፍ ቃል ቢያንስ 6 ፊደላት ሊኖሩት ይገባል / Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(1, "የይለፍ ቃል ማረጋገጫ ያስገቡ / Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "የይለፍ ቃሎቹ አይመሳሰሉም / Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const editProfileSchema = z.object({
  contactPerson: z.string().trim().min(1, "Contact name is required"),
  contactEmail: z.string().trim().email("Enter a valid email address"),
  contactPhone: z.string().trim().min(5, "Enter a valid phone number"),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

type AccountProfile = Record<string, unknown>;

const isRecord = (value: unknown): value is AccountProfile =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const unwrapAccountProfile = (value: unknown): AccountProfile => {
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

const readProfileText = (
  profile: AccountProfile | null,
  ...keys: string[]
): string => {
  if (!profile) return "";
  const value = keys
    .map((key) => profile[key])
    .find(
      (candidate) =>
        (typeof candidate === "string" || typeof candidate === "number") &&
        String(candidate).trim(),
    );
  return value === undefined ? "" : String(value).trim();
};

export default function CustomerProfilePage() {
  const { lang = "am" } = useParams<{ lang: string }>();
  const isAm = lang === "am";

  const { user, updatePassword, loading } = useAuthStore();
  const shouldLoadCustomerProfile = hasCustomerAccount(user);
  const { profile, getCustomerProfile } = useCustomerServiceStore();
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [accountProfileError, setAccountProfileError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [savedContact, setSavedContact] = useState<EditProfileFormData | null>(null);

  useEffect(() => {
    if (shouldLoadCustomerProfile) void getCustomerProfile();
  }, [getCustomerProfile, shouldLoadCustomerProfile]);

  useEffect(() => {
    if (!shouldLoadCustomerProfile) return;

    let active = true;
    void getCustomerAccountProfile()
      .then((response) => {
        if (active) {
          setAccountProfile(unwrapAccountProfile(response));
          setAccountProfileError(null);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAccountProfileError(
          error instanceof Error
            ? error.message
            : isAm
              ? "የመለያ ፕሮፋይሉን መጫን አልተቻለም።"
              : "Unable to load your account profile.",
        );
      });

    return () => {
      active = false;
    };
  }, [isAm, shouldLoadCustomerProfile]);

  const accountFirstName = readProfileText(accountProfile, "firstName", "FirstName");
  const accountLastName = readProfileText(accountProfile, "lastName", "LastName");
  const accountFullName = readProfileText(accountProfile, "fullName", "FullName", "name", "Name");
  const profileName =
    accountFullName ||
    [accountFirstName || user?.firstName, accountLastName || user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.username ||
    "Customer";
  const profilePhoto =
    readProfileText(
      accountProfile,
      "profilePictureUrl",
      "ProfilePictureUrl",
      "profilePhotoUrl",
      "ProfilePhotoUrl",
      "profilePhoto",
      "ProfilePhoto",
      "avatarUrl",
      "AvatarUrl",
    ) ||
    user?.profilePhoto ||
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80";
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  useEffect(() => {
    resetProfile({
      contactPerson: profile?.contactPerson || profileName,
      contactEmail: profile?.contactEmail || readProfileText(accountProfile, "email", "Email") || user?.email || "",
      contactPhone: profile?.contactPhone || readProfileText(accountProfile, "phone", "phoneNumber", "Phone", "PhoneNumber") || user?.phone || user?.phoneNumber || "",
    });
  }, [accountProfile, profile, profileName, resetProfile, user]);

  const onProfileSubmit = async (data: EditProfileFormData) => {
    setProfileSaveError(null);
    setProfileSaveSuccess(false);

    if (!shouldLoadCustomerProfile) {
      setProfileSaveError(isAm ? "የተጠቃሚ መለያ አልተገኘም።" : "Could not determine the user account to update.");
      return;
    }

    try {
      await updateCustomerProfile({
        businessName: profile?.businessName ?? undefined,
        businessAddress: profile?.businessAddress ?? undefined,
        city: profile?.city ?? undefined,
        state: profile?.state ?? undefined,
        postalCode: profile?.postalCode ?? undefined,
        contactPerson: data.contactPerson,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      });
      setSavedContact(data);
      if (shouldLoadCustomerProfile) await getCustomerProfile();
      setProfileSaveSuccess(true);
      setIsEditingProfile(false);
    } catch (error: unknown) {
      setProfileSaveError(
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : isAm ? "ፕሮፋይሉን ማዘመን አልተሳካም።" : "Unable to update your profile.",
      );
    }
  };

  const displayedContactPerson = savedContact?.contactPerson || profile?.contactPerson || profileName;
  const displayedContactEmail = savedContact?.contactEmail || profile?.contactEmail || readProfileText(accountProfile, "email", "Email") || user?.email || "";
  const displayedContactPhone = savedContact?.contactPhone || profile?.contactPhone || readProfileText(accountProfile, "phone", "phoneNumber", "Phone", "PhoneNumber") || user?.phone || user?.phoneNumber || "";

  const onSubmit = async (data: ChangePasswordFormData) => {
    setErrorMessage(null);
    setIsSuccess(false);

    try {
      await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setIsSuccess(true);
      reset();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : (isAm ? "የይለፍ ቃል መቀየር አልተሳካም።" : "Password update failed.")
      );
    }
  };

  return (
    <>
      <CustomerPageHeader
        eyebrow={isAm ? "አካውንት" : "Account"}
        title={isAm ? "ፕሮፋይል" : "Profile"}
        description={
          isAm
            ? "ለአገልግሎት ጥያቄዎች የሚጠቀሙባቸውን የመገናኛ መረጃዎች እዚህ ያስተዳድሩ።"
            : "Manage the contact details used for your import service requests."
        }
      />
      <main className="mx-auto max-w-[760px] space-y-6 p-5 sm:p-7">
        {/* Profile Card */}
        <section className="rounded border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-200 p-5">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded bg-blue-100 text-blue-700 font-bold text-lg">
              {user?.profilePhoto || user?.firstName ? (
                <Image
                  src={profilePhoto}
                  alt={profileName}
                  width={56}
                  height={56}
                  unoptimized
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-7 w-7" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {displayedContactPerson}
              </h2>
              <p className="text-xs text-slate-500">
                {isAm ? "ደንበኛ / አስመጪ" : "Customer / Importer"} · {profile?.userId ?? (readProfileText(accountProfile, "userId", "UserId", "id", "Id", "accountId", "AccountId") || user?.id || "—")}
              </p>
            </div>
          </div>

          {profileSaveSuccess && (
            <p className="mx-5 mt-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800" role="status">
              {isAm ? "የመገናኛ መረጃዎ ተዘምኗል።" : "Your contact details have been updated."}
            </p>
          )}
          {profileSaveError && (
            <p className="mx-5 mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800" role="alert">
              {profileSaveError}
            </p>
          )}
          {accountProfileError && (
            <p className="mx-5 mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800" role="alert">
              {accountProfileError}
            </p>
          )}

          {isEditingProfile ? (
            <form id="customer-profile-edit" onSubmit={handleProfileSubmit(onProfileSubmit)} className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contactPerson" className="mb-1 block text-xs font-medium text-slate-600">{isAm ? "የእውቂያ ሰው" : "Contact person"}</label>
                <input id="contactPerson" {...registerProfile("contactPerson")} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                {profileErrors.contactPerson && <p className="mt-1 text-xs text-rose-600">{profileErrors.contactPerson.message}</p>}
              </div>
              <div>
                <label htmlFor="contactEmail" className="mb-1 block text-xs font-medium text-slate-600">{isAm ? "ኢሜይል" : "Email"}</label>
                <input id="contactEmail" type="email" {...registerProfile("contactEmail")} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                {profileErrors.contactEmail && <p className="mt-1 text-xs text-rose-600">{profileErrors.contactEmail.message}</p>}
              </div>
              <div>
                <label htmlFor="contactPhone" className="mb-1 block text-xs font-medium text-slate-600">{isAm ? "ስልክ" : "Phone"}</label>
                <input id="contactPhone" type="tel" {...registerProfile("contactPhone")} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                {profileErrors.contactPhone && <p className="mt-1 text-xs text-rose-600">{profileErrors.contactPhone.message}</p>}
              </div>
            </form>
          ) : (
          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="h-4 w-4" /> {isAm ? "ኢሜይል" : "Email"}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">
                {displayedContactEmail}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="h-4 w-4" /> {isAm ? "ስልክ" : "Phone"}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">
                {displayedContactPhone}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-4 w-4" /> {isAm ? "ድርጅት" : "Organisation"}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">
                {profile?.businessName || "Horizon Agro Import PLC"}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-4 w-4" /> {isAm ? "አድራሻ" : "Business Address"}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">
                {profile?.businessAddress || "-"}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-2 text-xs text-slate-500">
                <UserRound className="h-4 w-4" /> {isAm ? "የንግድ አይነት" : "Business Type"}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">
                {profile?.businessType || "-"}
              </dd>
            </div>
          </dl>
          )}

          <div className="border-t border-slate-200 p-5">
            {isEditingProfile ? (
              <div className="flex flex-wrap gap-2">
                <button type="submit" form="customer-profile-edit" disabled={isSavingProfile} className="rounded bg-[#185a96] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#124574] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSavingProfile ? (isAm ? "እየተቀመጠ ነው..." : "Saving...") : (isAm ? "መረጃዎችን አስቀምጥ" : "Save changes")}
                </button>
                <button type="button" onClick={() => { setIsEditingProfile(false); setProfileSaveError(null); }} className="rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  {isAm ? "ሰርዝ" : "Cancel"}
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => { setIsEditingProfile(true); setProfileSaveSuccess(false); }} className="rounded bg-[#185a96] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#124574]">
                {isAm ? "ፕሮፋይል አስተካክል" : "Edit profile"}
              </button>
            )}
          </div>
        </section>

        {/* Change Password Section */}
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-50 text-blue-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isAm ? "የይለፍ ቃል መቀየሪያ" : "Security & Password"}
              </h3>
              <p className="text-xs text-slate-500">
                {isAm
                  ? "የአካውንትዎን ደህንነት ለመጠበቅ አዲስ የይለፍ ቃል ያስገቡ።"
                  : "Update your password to keep your account secure."}
              </p>
            </div>
          </div>

          {isSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>
                {isAm
                  ? "የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል!"
                  : "Your password has been updated successfully!"}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAm ? "የአሁኑ የይለፍ ቃል" : "Current Password"}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("currentPassword")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-2 focus:ring-[#185a96] outline-none transition text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-[11px] text-red-500 mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAm ? "አዲስ የይለፍ ቃል" : "New Password"}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("newPassword")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-2 focus:ring-[#185a96] outline-none transition text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-[11px] text-red-500 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAm ? "አዲሱን የይለፍ ቃል ያረጋግጡ" : "Confirm New Password"}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-2 focus:ring-[#185a96] outline-none transition text-slate-800"
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded bg-[#185a96] px-4 py-2 text-xs font-semibold text-white hover:bg-[#124574] transition disabled:opacity-50"
            >
              {loading
                ? isAm
                  ? "እየተቀየረ ነው..."
                  : "Updating..."
                : isAm
                ? "የይለፍ ቃል ቀይር"
                : "Update Password"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
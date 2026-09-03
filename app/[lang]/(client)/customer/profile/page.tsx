"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Mail, MapPin, Phone, UserRound, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { CustomerPageHeader } from "@/features/customer/components/CustomerPageHeader";
import { CustomerShell } from "@/features/customer/components/CustomerShell";
import useAuthStore from "@/modules/auth/auth.store";

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

export default function CustomerProfilePage() {
  const { lang = "am" } = useParams<{ lang: string }>();
  const isAm = lang === "am";

  const { user, updatePassword, loading } = useAuthStore();
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

  const onSubmit = async (data: ChangePasswordFormData) => {
    setErrorMessage(null);
    setIsSuccess(false);

    try {
      await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      } as any);

      setIsSuccess(true);
      reset();
    } catch (err: any) {
      setErrorMessage(
        err?.message || (isAm ? "የይለፍ ቃል መቀየር አልተሳካም።" : "Password update failed.")
      );
    }
  };

  return (
    <CustomerShell>
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
            <div className="flex h-14 w-14 items-center justify-center rounded bg-blue-100 text-blue-700 font-bold text-lg">
              {user?.firstName ? user.firstName[0].toUpperCase() : <UserRound className="h-7 w-7" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.username || "Selamawit Bekele"}
              </h2>
              <p className="text-xs text-slate-500">
                {isAm ? "ደንበኛ / አስመጪ" : "Customer / Importer"} · {user?.id || "CUS-10241"}
              </p>
            </div>
          </div>

          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="h-4 w-4" /> {isAm ? "ኢሜይል" : "Email"}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">
                {user?.email || "selamawit@horizonagro.et"}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="h-4 w-4" /> {isAm ? "ስልክ" : "Phone"}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">
                {user?.phone || "+251 911 234 567"}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="h-4 w-4" /> {isAm ? "ድርጅት" : "Organisation"}
              </dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">
                Horizon Agro Import PLC
              </dd>
            </div>
          </dl>

          <div className="border-t border-slate-200 p-5">
            <button className="rounded bg-[#185a96] px-4 py-2 text-xs font-semibold text-white hover:bg-[#124574] transition">
              {isAm ? "ፕሮፋይል አስተካክል" : "Edit profile"}
            </button>
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
    </CustomerShell>
  );
}
"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, KeyRound, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useAuthStore from "@/modules/auth/auth.store";

// Validation Schema
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "የይለፍ ቃል ቢያንስ 6 ፊደላት ሊኖሩት ይገባል / Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "የይለፍ ቃል ማረጋገጫ ያስገቡ / Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "የይለፍ ቃሎቹ አይመሳሰሉም / Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const lang = (params.lang as "am" | "en") || "am";
  const isAm = lang === "am";
  const token = searchParams.get("token") || "";

  const { resetPassword, loading, error: storeError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLocalError(null);

    if (!token) {
      setLocalError(isAm ? "ትክክለኛ ያልሆነ Token ነው" : "Invalid or missing token");
      return;
    }

    try {
      await resetPassword({
        token,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/${lang}/auth/login`);
      }, 3000);
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : (isAm ? "የይለፍ ቃል መቀየር አልተሳካም።" : "Password reset failed."));
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/30 bg-white/90 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-slate-100 bg-gradient-to-br from-blue-950 to-indigo-900 px-6 py-8 text-center text-white sm:px-10">
        <div className="mx-auto mb-4 inline-flex rounded-2xl border border-white/20 bg-white/10 p-3.5 shadow-inner">
          <KeyRound className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-extrabold">
          {isAm ? "አዲስ የይለፍ ቃል ማስተካከያ" : "Reset Your Password"}
        </h2>
        <p className="mt-2 text-xs text-blue-100">
          {isAm ? "እባክዎን አዲሱን የይለፍ ቃልዎን ያስገቡ" : "Enter your new password below"}
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-4 px-6 py-10 text-center sm:px-10">
          <div className="flex justify-center text-green-500">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <p className="text-xs font-semibold text-gray-700">
            {isAm
              ? "የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል! ወደ መግቢያ ገጽ እየተወሰዱ ነው..."
              : "Password updated successfully! Redirecting to login..."}
          </p>
          <Link
            href={`/${lang}/auth/login`}
            className="inline-block mt-2 text-xs font-bold text-blue-600 hover:underline"
          >
            {isAm ? "አሁኑኑ ይግቡ" : "Go to Login Now"}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 sm:p-10">
          {(localError || storeError) && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs text-center font-medium">
              {localError || storeError}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              {isAm ? "አዲስ የይለፍ ቃል" : "New Password"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              {isAm ? "የይለፍ ቃል ማረጋገጫ" : "Confirm New Password"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition text-gray-800"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading
              ? isAm ? "እየተቀየረ ነው..." : "Updating Password..."
              : isAm ? "የይለፍ ቃል ቀይር" : "Reset Password"}
          </button>

          <div className="border-t border-slate-100 pt-5 text-center">
            <Link
              href={`/${lang}/auth/login`}
              className="inline-flex items-center text-xs font-semibold text-blue-600 transition hover:text-blue-800"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              {isAm ? "ወደ መግቢያ ገጽ ተመለስ" : "Back to Login"}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useAuthStore from "@/modules/auth/auth.store";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function AdminResetPasswordPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = (params.lang as "am" | "en") || "en";
  const userId = params.id as string;
  const token = searchParams.get("token") || userId || "";
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
      setLocalError("Invalid or missing reset token");
      return;
    }

    try {
      await resetPassword({
        token,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      });
      setIsSuccess(true);
      window.setTimeout(() => router.push(`/${lang}/auth/login`), 3000);
    } catch (error: unknown) {
      setLocalError(error instanceof Error ? error.message : "Password reset failed.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-slate-100 bg-gradient-to-br from-blue-950 to-indigo-900 px-6 py-8 text-center text-white sm:px-10">
        <div className="mx-auto mb-4 inline-flex rounded-2xl border border-white/20 bg-white/10 p-3.5 shadow-inner">
          <KeyRound className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-extrabold">Reset User Password</h1>
        <p className="mt-2 text-xs text-blue-100">Set a new password for user {userId}</p>
      </div>

      {isSuccess ? (
        <div className="space-y-4 px-6 py-10 text-center sm:px-10">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <p className="text-xs font-semibold text-slate-700">
            Password updated successfully. Redirecting to login...
          </p>
          <Link href={`/${lang}/auth/login`} className="text-xs font-bold text-blue-600 hover:underline">
            Go to Login Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 sm:p-10">
          {(localError || storeError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600">
              {localError || storeError}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute inset-y-0 left-3.5 my-auto h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-[11px] text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? "Updating Password..." : "Reset Password"}
          </button>

          <div className="border-t border-slate-100 pt-5 text-center">
            <Link href={`/${lang}/admin/dashboard`} className="inline-flex items-center text-xs font-semibold text-blue-600 transition hover:text-blue-800">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

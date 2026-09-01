"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import { login } from "@/types/auth.service";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();

  const lang = (params.lang as "am" | "en") || "en";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // ============================================
      // 1. LOGIN API CALL
      // ============================================
      const res: any = await login({
        username: email,
        password,
      });

      // ============================================
      // 2. GET RESPONSE DATA & PAYLOAD
      // ============================================
      const responseData = res?.data || res;
      const payload =
        responseData?.payload ||
        responseData?.data ||
        responseData;

      // ============================================
      // 3. GET TOKEN & VALIDATE SUCCESS
      // ============================================
      const token =
        payload?.accessToken ||
        payload?.token ||
        responseData?.accessToken ||
        responseData?.token;

      // ሰርቨሩ success ካላለ ወይም ቶከን ከጠፋ 
      if (responseData?.isSuccess === false || !token) {
        throw new Error(responseData?.message || "ተጠቃሚው አልተገኘም ወይም የተሳሳተ password ነው!");
      }

      // ============================================
      // 4. EXTRACT ROLE FROM roles ARRAY OR object
      // ============================================
      const rawRoles = payload?.roles || responseData?.roles || [];
      let extractedRole = "customer";

      if (Array.isArray(rawRoles) && rawRoles.length > 0) {
        extractedRole = rawRoles[0]?.roleName || rawRoles[0] || "customer";
      } else if (typeof rawRoles === "string") {
        extractedRole = rawRoles;
      } else if (payload?.role) {
        extractedRole = payload.role;
      }

      // ============================================
      // 5. BUILD USER OBJECT
      // ============================================
      const user = {
        id: String(
          payload?.id ||
            responseData?.id ||
            "user-1"
        ),
        name:
          `${payload?.firstName || ""} ${
            payload?.lastName || ""
          }`.trim() ||
          payload?.username ||
          payload?.name ||
          email,
        email:
          payload?.email ||
          email,
        role: String(extractedRole).trim().toLowerCase(),
      };

      // ============================================
      // 6. SAVE LOGIN INFORMATION
      // ============================================
      useAuthStore.getState().login(user, token);

      const role = user.role;

      // ============================================
      // 7. ROLE BASED REDIRECT (ለ Customer እና Assessor ብቻ)
      // ============================================
      if (role === "assessor") {
        router.push(`/${lang}/admin/assessor/dashboard`);
        return;
      }

      if (role === "customer" || role === "importer") {
        router.push(`/${lang}/client/customer/dashboard`);
        return;
      }

      // ያልተፈቀደ ሚና ሲሆን
      setError(`Your account role "${user.role}" is not configured for this portal.`);
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(
        err?.response?.data?.message || err?.message || "ተጠቃሚው አልተገኘም ወይም የተሳሳተ password ነው!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-slate-950 m-0 p-0">
      <Image
        src="/login_image.png"
        alt="Import Export Management"
        fill
        sizes="100vw"
        className="object-cover object-center opacity-95 brightness-125 contrast-105 saturate-110"
        priority
      />

      <div className="absolute inset-0 bg-white/10" />

      {/* Login Card */}
      <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-900 to-indigo-900 p-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/25 shadow-[0_0_22px_rgba(255,255,255,0.55)] backdrop-blur-md">
            <svg
              className="h-6 w-6 text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.9)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-bold tracking-wide">
              Welcome
            </h1>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="flex flex-col space-y-4 p-6"
        >
          {error && (
            <div className="animate-shake rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Username */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Email or Username
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>

              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com or username"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs text-slate-900 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>

              <Link
                href={`/${lang}/forgot-password`}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-xs text-slate-900 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>
              {loading ? "Logging in..." : "Login"}
            </span>

            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Signup */}
          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500">
              New user?{" "}
              <Link
                href={`/${lang}/signup`}
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-3 text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Secure Transit Portal
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
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

  const extractRole = (dataItem: any): string => {
    // 1. userRoles array ውስጥ ያለውን የ role name መፈለግ
    const userRoleObj = dataItem?.userRoles?.[0]?.role;
    if (userRoleObj?.name) {
      return userRoleObj.name;
    }

    // 2. roles array (string or object)
    if (Array.isArray(dataItem?.roles) && dataItem.roles.length > 0) {
      const firstRole = dataItem.roles[0];
      return typeof firstRole === "object"
        ? firstRole?.roleName || firstRole?.name
        : firstRole;
    }

    // 3. single role string
    if (typeof dataItem?.role === "string") {
      return dataItem.role;
    }

    // 4. isSuperAdmin boolean ከሆነ
    if (dataItem?.isSuperAdmin) {
      return "superadmin";
    }

    return "customer";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Backend የሚፈልገው 'userName' (በካፒታል N)
      const res: any = await login({
        userName: email.trim(),
        password,
      });

      // Response Structure፡ res -> response -> data -> [0] ወይም res -> data
      const userObj =
        res?.response?.data?.[0] ||
        res?.data?.[0] ||
        res?.response?.data ||
        res?.data ||
        res;

      // Token ፍለጋ (refreshToken, accessToken, ወይም token)
      const token =
        userObj?.refreshToken ||
        userObj?.accessToken ||
        userObj?.token ||
        res?.refreshToken ||
        res?.token;

      if (res?.isSuccess === false || res?.error || !token || !userObj) {
        throw new Error(
          res?.message || "ተጠቃሚው አልተገኘም ወይም የተሳሳተ password ነው!"
        );
      }

      const extractedRole = extractRole(userObj).toLowerCase().trim();

      const fullName = [userObj?.firstName, userObj?.lastName]
        .filter(Boolean)
        .join(" ");

      const user = {
        id: String(userObj?.id || "user-1"),
        name: fullName || userObj?.username || userObj?.userName || email,
        email: userObj?.email || email,
        role: extractedRole,
      };

      useAuthStore.getState().login(user, token);

      // --- ROUTING LOGIC ---
      if (
        extractedRole === "superadmin" ||
        extractedRole === "admin" ||
        extractedRole === "assessor"
      ) {
        router.push(`/${lang}/admin/dashboard`);
        return;
      }

      if (extractedRole === "customer" || extractedRole === "importer") {
        router.push(`/${lang}/client/customer/dashboard`);
        return;
      }

      setError(
        `Your account role "${user.role}" is not configured for this portal.`
      );
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "ተጠቃሚው አልተገኘም ወይም የተሳሳተ password ነው!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center overflow-hidden bg-white">
      {/* FULL SCREEN BRIGHT BACKGROUND IMAGE */}
      <div className="absolute inset-0 h-full w-full">
        <Image
          src="/login_image.png"
          alt="Import Export Management"
          fill
          priority
          sizes="100vw"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* LOGIN CARD - ABSOLUTE CENTER WITH CLEAR SHADOW */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-md">
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
              <h1 className="text-lg font-bold tracking-wide">Welcome</h1>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col space-y-4 p-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600">
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
                  onClick={() => setShowPassword(!showPassword)}
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
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
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
    </div>
  );
}
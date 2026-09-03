"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, ArrowLeft } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, Button, Input } from "antd";

import useAuthStore from "@/modules/auth/auth.store";

// 1. Zod Schema Validation
const signupSchema = z.object({
  firstName: z.string().min(2, { message: "ስም ቢያንስ 2 ፊደላት ሊኖሩት ይገባል / First name is too short" }),
  lastName: z.string().min(2, { message: "የአባት ስም ቢያንስ 2 ፊደላት ሊኖሩት ይገባል / Last name is too short" }),
  username: z.string().min(3, { message: "የመጠቀሚያ ስም ቢያንስ 3 ፊደላት ሊኖሩት ይገባል / Username is too short" }),
  email: z.string().email({ message: "ትክክለኛ ኢሜይል ያስገቡ / Invalid email address" }),
  phonenumber: z.string().min(9, { message: "ትክክለኛ ስልክ ቁጥር ያስገቡ / Invalid phone number" }),
  password: z.string().min(8, { message: "የይለፍ ቃል ቢያንስ 8 ፊደላት ሊኖሩት ይገባል / Password must be at least 8 characters" }),
  confirmpassword: z.string(),
}).refine((data) => data.password === data.confirmpassword, {
  message: "የይለፍ ቃሎቹ አይመሳሰሉም / Passwords don't match",
  path: ["confirmpassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUpPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params.lang as "am" | "en") || "am";
  const isAm = lang === "am";

  const { signUp, loading, error: storeError } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phonenumber: "",
      password: "",
      confirmpassword: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setLocalError(null);
    try {
      // Multipart/form-data payload ማዘጋጀት
      const formDataPayload = new FormData();
      formDataPayload.append("FirstName", data.firstName);
      formDataPayload.append("LastName", data.lastName);
      formDataPayload.append("Username", data.username);
      formDataPayload.append("Email", data.email);
      formDataPayload.append("Phone", data.phonenumber);
      formDataPayload.append("Password", data.password);

      if (selectedFile) {
        formDataPayload.append("ProfileFile", selectedFile);
      }

      formDataPayload.append("IsSuperAdmin", "false");
      formDataPayload.append("Roles", "1");

      await signUp(formDataPayload as any);

      router.push(`/${lang}/auth/login?registered=true`);
    } catch (err: any) {
      setLocalError(err?.message || (isAm ? "ምዝገባው አልተሳካም።" : "Registration failed."));
    }
  };

  return (
    <div className="flex py-8 items-center justify-center min-h-screen bg-slate-50">
      <div
        style={{ minWidth: 460, maxWidth: 600, backgroundColor: "#FDFEFE", borderRadius: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", padding: "2rem" }}
      >
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 bg-blue-50 text-blue-900 rounded-2xl mb-2 shadow-inner">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold" }} className="text-gray-800">
            {isAm ? "አዲስ አካውንት መፍጠር" : "Sign Up"}
          </h1>
          <span className="text-sm text-gray-500">
            {isAm ? "ለአስመጪዎች እና ባለድርሻ አካላት የተዘጋጀ" : "Enter your details to create your account and get started."}
          </span>
        </div>

        {(localError || storeError) && (
          <div className="mb-4">
            <Alert message={localError || storeError} type="error" showIcon closable />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* First Name */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                {isAm ? "ስም" : "First Name"}
              </label>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="First Name"
                    style={{ padding: "10px", borderRadius: "0.75rem" }}
                    variant="filled"
                  />
                )}
              />
              {errors.firstName && (
                <p className="text-[11px] text-red-500 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                {isAm ? "የአባት ስም" : "Last Name"}
              </label>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Last Name"
                    style={{ padding: "10px", borderRadius: "0.75rem" }}
                    variant="filled"
                  />
                )}
              />
              {errors.lastName && (
                <p className="text-[11px] text-red-500 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              {isAm ? "ኢሜይል አድራሻ" : "Email"}
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="name@example.com"
                  style={{ padding: "10px", borderRadius: "0.75rem" }}
                  variant="filled"
                />
              )}
            />
            {errors.email && (
              <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                {isAm ? "የመጠቃሚያ ስም" : "Username"}
              </label>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Username"
                    style={{ padding: "10px", borderRadius: "0.75rem" }}
                    variant="filled"
                  />
                )}
              />
              {errors.username && (
                <p className="text-[11px] text-red-500 mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                {isAm ? "ስልክ ቁጥር" : "Phone Number"}
              </label>
              <Controller
                name="phonenumber"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+251 9XXXXXXXX"
                    style={{ padding: "10px", borderRadius: "0.75rem" }}
                    variant="filled"
                  />
                )}
              />
              {errors.phonenumber && (
                <p className="text-[11px] text-red-500 mt-1">{errors.phonenumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                {isAm ? "የይለፍ ቃል" : "Password"}
              </label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    placeholder="••••••••"
                    style={{ padding: "8px", borderRadius: "0.75rem" }}
                    variant="filled"
                  />
                )}
              />
              {errors.password && (
                <p className="text-[11px] text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                {isAm ? "የይለፍ ቃል ያረጋግጡ" : "Confirm Password"}
              </label>
              <Controller
                name="confirmpassword"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    placeholder="••••••••"
                    style={{ padding: "8px", borderRadius: "0.75rem" }}
                    variant="filled"
                  />
                )}
              />
              {errors.confirmpassword && (
                <p className="text-[11px] text-red-500 mt-1">{errors.confirmpassword.message}</p>
              )}
            </div>
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              {isAm ? "የፕሮፋይል ፎቶ (ከተፈለገ)" : "Profile Picture (Optional)"}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: "2.8rem",
                borderRadius: "0.75rem",
                fontWeight: "bold",
                backgroundColor: "#1e3a8a",
              }}
            >
              {loading ? (isAm ? "እየተመዘገበ ነው..." : "Signing Up...") : (isAm ? "ይመዝገቡ" : "Sign Up")}
            </Button>
          </div>
        </form>

        {/* Login Redirect Link */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link
            href={`/${lang}/auth/login`}
            className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            {isAm ? "አካውንት አለዎት? ይግቡ" : "Already have an account? Sign In"}
          </Link>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, CheckCircle2, FileImage, Lock, Mail, ShieldCheck, Upload, User } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, Button, Input } from "antd";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import useAuthStore from "@/modules/auth/auth.store";
import { authRoutes } from "@/modules/auth/auth.routes";

const signupSchema = z.object({
  firstName: z.string().min(2, "ስም ቢያንስ 2 ፊደላት ሊኖሩት ይገባል / First name is too short"),
  lastName: z.string().min(2, "የአባት ስም ቢያንስ 2 ፊደላት ሊኖሩት ይገባል / Last name is too short"),
  username: z.string().min(3, "የመጠቀሚያ ስም ቢያንስ 3 ፊደላት ሊኖሩት ይገባል / Username is too short"),
  email: z.string().email("ትክክለኛ ኢሜይል ያስገቡ / Invalid email address"),
  phonenumber: z.string().min(9, "ትክክለኛ ስልክ ቁጥር ያስገቡ / Invalid phone number"),
  password: z.string().min(8, "የይለፍ ቃል ቢያንስ 8 ፊደላት ሊኖሩት ይገባል / Password must be at least 8 characters"),
  confirmpassword: z.string(),
}).refine((data) => data.password === data.confirmpassword, {
  message: "የይለፍ ቃሎቹ አይመሳሰሉም / Passwords don't match",
  path: ["confirmpassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;
type FieldIcon = typeof User;

function Label({ children, optional = false }: { children: React.ReactNode; optional?: boolean }) {
  return <span className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">{children}{!optional && <span className="text-cyan-600">*</span>}</span>;
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-[11px] font-medium text-rose-600">{message}</p> : null;
}

export default function SignUpPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params.lang as "am" | "en") || "en";
  const isAm = lang === "am";
  const { signUp, loading, error: storeError } = useAuthStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", username: "", email: "", phonenumber: "", password: "", confirmpassword: "" },
  });

  const onSubmit = async (data: SignupFormData) => {
    setLocalError(null);
    try {
      const payload = new FormData();
      payload.append("FirstName", data.firstName);
      payload.append("LastName", data.lastName);
      payload.append("Username", data.username);
      payload.append("Email", data.email);
      payload.append("Phone", data.phonenumber);
      payload.append("Password", data.password);
      payload.append("IsSuperAdmin", "false");
      payload.append("Roles", "1");
      if (selectedFile) payload.append("ProfileFile", selectedFile);
      await signUp(payload);
      router.push(`${authRoutes.login(lang)}?registered=true`);
    } catch (error: unknown) {
      setLocalError(error instanceof Error ? error.message : (isAm ? "ምዝገባው አልተሳካም።" : "Registration failed."));
    }
  };

  const inputClass = "!h-11 !rounded-lg !border-slate-200 !bg-slate-50/70 !px-3.5 !text-sm !text-slate-900 !placeholder:text-slate-400 hover:!border-cyan-500 focus:!border-cyan-500 focus:!shadow-[0_0_0_3px_rgba(6,182,212,0.12)]";
  const iconClass = "h-4 w-4 text-slate-400";
  const input = (name: keyof SignupFormData, Icon: FieldIcon, placeholder: string, type = "text") => (
    <Controller name={name} control={control} render={({ field }) => <Input {...field} type={type} prefix={<Icon className={`${iconClass} mr-1`} />} placeholder={placeholder} className={inputClass} />} />
  );

  return (
    <div className="w-full overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,42,68,0.18)] lg:grid lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="relative hidden min-h-[720px] overflow-hidden bg-[#0b2942] lg:block">
        <Image src="/login_image.png" alt="Transit operations" fill priority className="object-cover opacity-35" sizes="45vw" />
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(7,35,59,0.96),rgba(10,67,91,0.84),rgba(6,112,127,0.72))]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-12">
          <div>
            <div className="mb-16 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10"><ShieldCheck className="h-5 w-5 text-cyan-200" /></div><div><p className="text-sm font-bold tracking-wide">Transit Portal</p><p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/70">Secure access</p></div></div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">{isAm ? "ወደ መድረኩ ይቀላቀሉ" : "Join the portal"}</p>
            <h1 className="max-w-sm text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">{isAm ? "የንግድ ጉዞዎን ከዚህ ይጀምሩ" : "Move your trade forward."}</h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-slate-200/80">{isAm ? "የእቃ ማስመጣት እና የመጓጓዣ አገልግሎቶችን በአንድ የተደራጀ መድረክ ያስተዳድሩ።" : "Create a secure account to manage import services, documents, and transit requests in one place."}</p>
          </div>
          <div className="space-y-3 border-t border-white/15 pt-6 text-sm text-slate-200/85">{[isAm ? "የተጠበቀ የተጠቃሚ መረጃ" : "Protected account information", isAm ? "የተደራጀ የአገልግሎት መዳረሻ" : "Organized service access", isAm ? "የሚታይ የጥያቄ ሂደት" : "Clear request progress"].map((item) => <div key={item} className="flex items-center gap-3"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200"><Check className="h-3 w-3" /></span>{item}</div>)}</div>
        </div>
      </aside>

      <section className="px-5 py-7 sm:px-10 sm:py-10 lg:px-12 xl:px-16">
        <div className="mb-8 flex justify-end"><Link href={`/${lang}/auth/login`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-cyan-700"><ArrowLeft className="h-3.5 w-3.5" />{isAm ? "ወደ መግቢያ" : "Back to sign in"}</Link></div>
        <div className="mb-8 max-w-xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />{isAm ? "የተጠቃሚ ምዝገባ" : "Account registration"}</div><h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{isAm ? "አዲስ አካውንት ይፍጠሩ" : "Create your account"}</h2><p className="mt-3 text-sm leading-6 text-slate-500">{isAm ? "የእርስዎን መረጃ ያስገቡ።" : "Set up your secure profile. It only takes a few minutes to get started."}</p></div>
        {(localError || storeError) && <div className="mb-6"><Alert message={localError || storeError} type="error" showIcon closable /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
          <section><div className="mb-4 flex items-center gap-3"><span className="text-xs font-bold tracking-[0.16em] text-slate-400">01</span><h3 className="text-sm font-bold text-slate-800">{isAm ? "የግል መረጃ" : "Personal information"}</h3><span className="h-px flex-1 bg-slate-100" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>{isAm ? "ስም" : "First name"}</Label>{input("firstName", User, isAm ? "ስምዎን ያስገቡ" : "Your first name")}<ErrorText message={errors.firstName?.message} /></div><div><Label>{isAm ? "የአባት ስም" : "Last name"}</Label>{input("lastName", User, isAm ? "የአባት ስም" : "Your last name")}<ErrorText message={errors.lastName?.message} /></div></div></section>
          <section><div className="mb-4 flex items-center gap-3"><span className="text-xs font-bold tracking-[0.16em] text-slate-400">02</span><h3 className="text-sm font-bold text-slate-800">{isAm ? "የመገኛ መረጃ" : "Contact details"}</h3><span className="h-px flex-1 bg-slate-100" /></div><div className="space-y-4"><div><Label>{isAm ? "ኢሜይል አድራሻ" : "Email address"}</Label>{input("email", Mail, "name@example.com", "email")}<ErrorText message={errors.email?.message} /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>{isAm ? "የመጠቃሚያ ስም" : "Username"}</Label>{input("username", User, "Choose a username")}<ErrorText message={errors.username?.message} /></div><div className="min-w-0"><Label>{isAm ? "ስልክ ቁጥር" : "Phone number"}</Label><Controller name="phonenumber" control={control} render={({ field }) => <PhoneInput country="et" value={field.value} onChange={field.onChange} placeholder="+251 9 12 34 56 78" inputProps={{ name: field.name, required: true, autoComplete: "tel", "aria-label": "Phone number" }} containerStyle={{ width: "100%" }} inputStyle={{ width: "100%", height: "44px", paddingLeft: "58px", paddingRight: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#0f172a", fontSize: "14px", lineHeight: "44px" }} buttonStyle={{ width: "48px", border: "1px solid #e2e8f0", borderRight: "0", borderRadius: "8px 0 0 8px", backgroundColor: "#f8fafc" }} dropdownClass="!z-50" />} /><ErrorText message={errors.phonenumber?.message} /></div></div></div></section>
          <section><div className="mb-4 flex items-center gap-3"><span className="text-xs font-bold tracking-[0.16em] text-slate-400">03</span><h3 className="text-sm font-bold text-slate-800">{isAm ? "የደህንነት መረጃ" : "Account security"}</h3><span className="h-px flex-1 bg-slate-100" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>{isAm ? "የይለፍ ቃል" : "Password"}</Label><Controller name="password" control={control} render={({ field }) => <Input.Password {...field} prefix={<Lock className="h-4 w-4 text-slate-400" />} placeholder="At least 8 characters" className={inputClass} />} /><ErrorText message={errors.password?.message} /></div><div><Label>{isAm ? "የይለፍ ቃል ያረጋግጡ" : "Confirm password"}</Label><Controller name="confirmpassword" control={control} render={({ field }) => <Input.Password {...field} prefix={<Lock className="h-4 w-4 text-slate-400" />} placeholder="Repeat your password" className={inputClass} />} /><ErrorText message={errors.confirmpassword?.message} /></div></div></section>
          <section><div className="mb-4 flex items-center gap-3"><span className="text-xs font-bold tracking-[0.16em] text-slate-400">04</span><h3 className="text-sm font-bold text-slate-800">{isAm ? "የመለያ ፎቶ" : "Profile photo"}<span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-slate-400">({isAm ? "አማራጭ" : "optional"})</span></h3><span className="h-px flex-1 bg-slate-100" /></div><label className="group flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 transition hover:border-cyan-500 hover:bg-cyan-50/40"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 group-hover:text-cyan-600"><FileImage className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-700">{selectedFile ? selectedFile.name : (isAm ? "ፎቶ ይምረጡ" : "Choose a profile photo")}</span><span className="mt-1 block text-xs text-slate-400">PNG, JPG or WEBP · max 5MB</span></span>{selectedFile ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Upload className="h-5 w-5 text-slate-400 group-hover:text-cyan-600" />}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} /></label></section>
          <div className="border-t border-slate-100 pt-6"><Button type="primary" htmlType="submit" loading={loading} block className="!h-12 !rounded-lg !border-0 !bg-[#0b2942] !text-sm !font-bold !shadow-[0_10px_22px_rgba(11,41,66,0.18)] hover:!bg-cyan-700">{loading ? (isAm ? "እየተመዘገበ ነው..." : "Creating your account...") : (isAm ? "አካውንት ይፍጠሩ" : "Create account")}</Button><p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />{isAm ? "መረጃዎ በደህንነት ይጠበቃል" : "Your information is protected and encrypted"}</p></div>
        </form>
      </section>
    </div>
  );
}

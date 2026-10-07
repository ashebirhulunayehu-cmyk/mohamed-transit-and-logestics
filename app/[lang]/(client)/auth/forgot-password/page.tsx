// app/[lang]/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowLeft, LoaderCircle, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthStore from '@/modules/auth/auth.store'; // እንደ የፋይልህ ፓዝ አስተካክለው

// Zod Validation Schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'ትክክለኛ ኢሜይል ያስገቡ / Invalid email address' })
    .regex(/\.[A-Z]{2,}$/i, {
      message: 'ትክክለኛ የኢሜይል ዶሜይን ያስገቡ / Enter a valid email domain with a top-level domain',
    }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const params = useParams();
  const lang = (params.lang as 'am' | 'en') || 'am';
  const isAm = lang === 'am';

  const { forgotPassword, loading, error: storeError } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLocalError(null);
    try {
      await forgotPassword({
        email: data.email.trim(),
      });
      setSubmittedEmail(data.email.trim());
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : (isAm ? 'ጥያቄው አልተሳካም።' : 'Request failed.');

      if (/account\s+does\s+not\s+exist|account\s+not\s+found/i.test(message)) {
        setSubmittedEmail(data.email.trim());
        setIsSuccess(true);
        return;
      }

      setLocalError(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[360px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-4 text-center">
      {isSuccess ? (
        <div className="space-y-2.5 py-2 text-center" role="status" aria-live="polite">
          <div className="inline-flex rounded-full bg-emerald-50 p-3 text-emerald-700">
            <Mail className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">
            {isAm ? 'ኢሜይልዎን ይመልከቱ' : 'Check Your Email'}
          </h2>
          <p className="text-[10px] leading-relaxed text-gray-600">
            {isAm ? (
              <>የይለፍ ቃል ማስተካከያ ሊንክ ወደ <strong className="break-all text-gray-800">{submittedEmail}</strong> ልከናል። ኢሜይልዎን ይመልከቱና መመሪያዎቹን ይከተሉ።</>
            ) : (
              <>If an account exists for <strong className="break-all text-gray-800">{submittedEmail}</strong>, we have sent a password reset link. Please check your inbox and follow the instructions.</>
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="inline-flex rounded-lg bg-blue-50 p-2 text-blue-900 shadow-inner">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mb-1 text-center text-base font-extrabold text-gray-800">
            {isAm ? 'የይለፍ ቃል ማግኛ' : 'Password Recovery'}
          </h2>
          <p className="mb-3 text-center text-[10px] leading-relaxed text-gray-500">
            {isAm
              ? 'የተመዘገቡበትን ኢሜይል ያስገቡ የማግኛ ሊንክ እንልክልዎታለን።'
              : 'Enter your registered email to receive a password reset link.'}
          </p>

          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 text-left">
          {(localError || storeError || errors.email) && (
            <div className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-md text-[10px] text-center font-medium">
              {localError || storeError || errors.email?.message}
            </div>
          )}

          <div>
            <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-center w-full">
              {isAm ? 'ኢሜይል አድራሻ' : 'Email Address'}
            </label>
            <input
              type="email"
              readOnly={isSubmitting}
              placeholder="username@mame.et"
              {...register('email')}
              className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-md text-[11px] focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition text-gray-800 read-only:cursor-not-allowed read-only:opacity-70"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full py-2.5 px-3 bg-blue-900 hover:bg-blue-800 text-white rounded-md font-semibold text-[11px] transition shadow-lg shadow-blue-900/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || loading ? (
              <span className="inline-flex items-center justify-center">
                <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                {isAm ? 'እየተላከ ነው...' : 'Sending Link...'}
              </span>
            ) : isAm ? 'ሊንክ ላክ' : 'Send Reset Link'}
          </button>
          </form>
        </>
      )}

      <div className="mt-3 pt-2.5 border-t border-gray-100 text-center">
        <Link
          href={`/${lang}/auth/login`}
          className="inline-flex items-center text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          {isAm ? 'ወደ መግቢያ ገጽ ተመለስ' : 'Back to Login'}
        </Link>
      </div>
    </div>
  );
}
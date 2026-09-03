// app/[lang]/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthStore from '@/modules/auth/auth.store'; // እንደ የፋይልህ ፓዝ አስተካክለው

// Zod Validation Schema
const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: 'ትክክለኛ ኢሜይል ያስገቡ / Invalid email address',
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLocalError(null);
    try {
      await forgotPassword({
        email: data.email,
        newPassword: ''
      });
      setIsSuccess(true);
    } catch (err: any) {
      setLocalError(
        err?.message || (isAm ? 'ጥያቄው አልተሳካም።' : 'Request failed.')
      );
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 text-center">
      <div className="inline-flex p-3.5 bg-blue-50 text-blue-900 rounded-2xl mb-4 shadow-inner">
        <KeyRound className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-gray-800 mb-2">
        {isAm ? 'የይለፍ ቃል ማግኛ' : 'Password Recovery'}
      </h2>
      <p className="text-xs text-gray-500 mb-6">
        {isAm
          ? 'የተመዘገቡበትን ኢሜይል ያስገቡ የማግኛ ሊንክ እንልክልዎታለን።'
          : 'Enter your registered email to receive a password reset link.'}
      </p>

      {isSuccess ? (
        <div className="text-center space-y-4 py-2">
          <div className="flex justify-center text-green-600">
            <CheckCircle2 className="w-12 h-12 animate-bounce" />
          </div>
          <p className="text-xs font-semibold text-gray-700 leading-relaxed">
            {isAm
              ? 'የይለፍ ቃል መቀየሪያ ሊንክ ወደ ኢሜይልዎ ተልኳል። እባክዎን ኢሜይልዎን ይፈትሹ!'
              : 'Password reset link has been sent to your email. Please check your inbox!'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          {(localError || storeError) && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs text-center font-medium">
              {localError || storeError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              {isAm ? 'ኢሜይል አድራሻ' : 'Email Address'}
            </label>
            <input
              type="email"
              placeholder="username@mame.et"
              {...register('email')}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition text-gray-800"
            />
            {errors.email && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading
              ? isAm
                ? 'እየተላከ ነው...'
                : 'Sending Link...'
              : isAm
              ? 'ሊንክ ላክ'
              : 'Send Reset Link'}
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100">
        <Link
          href={`/${lang}/auth/login`}
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          {isAm ? 'ወደ መግቢያ ገጽ ተመለስ' : 'Back to Login'}
        </Link>
      </div>
    </div>
  );
}
// app/[lang]/(auth)/forgot-password/page.tsx
'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const params = useParams();
  const lang = (params.lang as 'am' | 'en') || 'am';

  const isAm = lang === 'am';

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 text-center">
      <div className="inline-flex p-3.5 bg-blue-50 text-blue-900 rounded-2xl mb-4 shadow-inner">
        <KeyRound className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold text-gray-800 mb-2">
        {isAm ? 'የይለፍ ቃል ማግኛ' : 'Password Recovery'}
      </h2>
      <p className="text-xs text-gray-500 mb-6">
        {isAm ? 'የተመዘገቡበትን ኢሜይል ያስገቡ የማግኛ ሊንክ እንልክልዎታለን።' : 'Enter your registered email to receive a password reset link.'}
      </p>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 text-left">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            {isAm ? 'ኢሜይል አድራሻ' : 'Email Address'}
          </label>
          <input 
            type="email" 
            required
            placeholder="username@mame.et"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition text-gray-800"
          />
        </div>

        <button 
          type="submit"
          className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-blue-900/20"
        >
          {isAm ? 'ሊንክ ላክ' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <Link href={`/${lang}/auth/login`} className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          {isAm ? 'ወደ መግቢያ ገጽ ተመለስ' : 'Back to Login'}
        </Link>
      </div>
    </div>
  );
}
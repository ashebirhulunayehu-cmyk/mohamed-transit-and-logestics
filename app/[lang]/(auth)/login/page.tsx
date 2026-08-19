'use client';
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden">
      
      {/* 1. የግራ በኩል ክፍል (እኩል 50% - ምስሉ ሙሉውን ክፍል ይሞላል) */}
      <div className="hidden lg:block lg:w-1/2 relative h-screen">
        <Image 
          src="/logo_image.png" 
          alt="Import Export Management" 
          fill
          className="object-cover w-full h-full"
          priority
        />
      </div>

      {/* 2. የቀኝ በኩል ክፍል (እኩል 50% - የሎጊን ካርዱን ከግራው ጋር እኩል ቁመት እና ስፋት እንዲኖረው ማድረግ) */}
      <div className="w-full lg:w-1/2 h-screen flex items-center justify-center p-6 lg:p-10 bg-slate-50 overflow-y-auto">
        <div className="w-full h-full max-w-2xl flex flex-col justify-between bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          
          {/* የካርዱ ሄደር */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-8 text-center text-white relative shrink-0">
            <div className="mx-auto w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-4 shadow-inner">
              <svg className="w-6 h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            
            <div className="absolute top-4 right-4">
              <span className="text-[11px] font-semibold bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                🌐 EN / አማ
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight">MOT Import Services</h2>
            <p className="text-xs text-blue-200 mt-1">Assessor Portal</p>
          </div>

          {/* የፎርም አካል */}
          <form onSubmit={handleLogin} className="p-8 space-y-6 flex-1 flex flex-col justify-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email or Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="assessor@mame.et"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 transition"
            >
              <span>Login</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                New user?{' '}
                <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          {/* የካርዱ ፉተር */}
          <div className="border-t border-slate-100 p-4 text-center bg-slate-50/50 shrink-0">
            <p className="text-[10px] text-slate-400 font-medium">
              Secure Customs & Transit Compliance System
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
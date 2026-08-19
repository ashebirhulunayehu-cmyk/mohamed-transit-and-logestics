"use client";

import React from "react";
import { UploadCloud } from "lucide-react";

export function UploadSection() {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center shadow-sm hover:border-sky-500 transition-all cursor-pointer group">
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="p-3 bg-sky-50 text-sky-600 rounded-full group-hover:scale-105 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Upload documents</h3>
        <p className="text-xs text-slate-500">
          Drag files here, or browse. PDF, JPG, PNG, XLSX up to 25 MB each.
        </p>
        <button className="mt-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors">
          Browse files
        </button>
      </div>
    </div>
  );
}
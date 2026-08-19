"use client";

import React from "react";
import { useDocumentStore } from "../document.store";
import { FileText, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export function DocumentStats() {
  const documents = useDocumentStore((state) => state.documents);

  const total = documents.length;
  const verified = documents.filter((d) => d.status === "Verified").length;
  const flagged = documents.filter((d) => d.status === "Flagged").length;
  const rejected = documents.filter((d) => d.status === "Rejected").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Files</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{total}</p>
        </div>
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
          <FileText className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">Verified</p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{verified}</p>
        </div>
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <CheckCircle className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-amber-600 uppercase">Flagged</p>
          <p className="text-xl font-bold text-amber-700 mt-0.5">{flagged}</p>
        </div>
        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
          <AlertTriangle className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-rose-600 uppercase">Rejected</p>
          <p className="text-xl font-bold text-rose-700 mt-0.5">{rejected}</p>
        </div>
        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
          <XCircle className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
"use client";

import React from "react";
import { useServiceStore } from "../service.store";
import { FileText, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export function ServiceStats() {
  const services = useServiceStore((state) => state.services);

  const total = services.length;
  const inProgress = services.filter((s) => s.status === "In progress" || s.status === "Needs review").length;
  const actionRequired = services.filter((s) => s.status === "Requires customer action").length;
  const blocked = services.filter((s) => s.status === "Blocked").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Total Registered Cases</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
        </div>
        <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Active / In Progress</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">{inProgress}</p>
        </div>
        <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Requires Action</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{actionRequired}</p>
        </div>
        <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">Blocked Cases</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{blocked}</p>
        </div>
        <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
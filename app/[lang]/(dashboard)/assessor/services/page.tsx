"use client";

import React from "react";
import { ServiceStats } from "@/features/services/components/ServiceStats";
import { ServiceFilters } from "@/features/services/components/ServiceFilters";
import { ServiceTable } from "@/features/services/components/ServiceTable";

export default function ServicesPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 text-slate-800 font-sans">
      {/* Page Title & Header */}
      <div>
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase block">
          CASE REGISTER
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Services</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cases visible to you for valuation and compliance assessment.
        </p>
      </div>

      {/* Stats Cards */}
      <ServiceStats />

      {/* Filter Toolbar */}
      <ServiceFilters />

      {/* Data Table */}
      <ServiceTable />
    </div>
  );
}
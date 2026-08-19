"use client";

import React from "react";
import { ServiceReviewStats } from "@/features/service-reviews/components/ServiceReviewStats";
import { ServiceReviewQueue } from "@/features/service-reviews/components/ServiceReviewQueue";
import { ServiceReviewDetails } from "@/features/service-reviews/components/ServiceReviewDetails";

export default function ServiceReviewsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Valuation & Compliance
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Service reviews</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cases submitted for assessment sign-off, ordered by risk channel and time in stage.
        </p>
      </div>

      {/* Stats Cards Row */}
      <ServiceReviewStats />

      {/* Main Content Layout */}
      <div className="space-y-6">
        <ServiceReviewQueue />
        <ServiceReviewDetails />
      </div>
    </div>
  );
}
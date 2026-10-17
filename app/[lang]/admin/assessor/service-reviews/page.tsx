"use client";

import React from "react";
import { ServiceReviewStats } from "@/features/service-reviews/components/ServiceReviewStats";
import { ServiceReviewQueue } from "@/features/service-reviews/components/ServiceReviewQueue";
import { ServiceReviewDetails } from "@/features/service-reviews/components/ServiceReviewDetails";

export default function ServiceReviewsPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 font-sans text-slate-800 sm:px-6 lg:px-8">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Valuation & Compliance
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Service reviews</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
          Submitted cases and active services flagged for assessor attention, ordered by risk channel and time in stage.
        </p>
      </div>

      <ServiceReviewStats />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <ServiceReviewQueue />
        <ServiceReviewDetails />
      </div>
    </div>
  );
}
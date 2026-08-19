"use client";

import React from "react";
import { VerificationStatus } from "../document.types";

interface DocumentStatusBadgeProps {
  status: VerificationStatus;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  switch (status) {
    case "Verified":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Verified
        </span>
      );
    case "Flagged":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Flagged
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Rejected
        </span>
      );
    case "Pending check":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          Pending check
        </span>
      );
  }
}
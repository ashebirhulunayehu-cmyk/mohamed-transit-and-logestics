"use client";

import React, { useState } from "react";
import { ApprovalApplicant } from "@/data/assessorMockData";
import {
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  RotateCcw,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface ApprovalDetailsProps {
  applicant: ApprovalApplicant;
}

export function ApprovalDetails({ applicant }: ApprovalDetailsProps) {
  const [note, setNote] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Verified
          </span>
        );
      case "Flagged":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Flagged
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-100 text-sky-800">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
            Pending check
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Importer Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{applicant.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {applicant.importerType} · licence {applicant.licence}
            </p>
          </div>
          <div>{getStatusBadge(applicant.status)}</div>
        </div>

        {/* Customer Info Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-5 text-sm">
          <div>
            <span className="text-slate-500 block text-xs font-medium">Customer ID</span>
            <span className="font-semibold text-slate-800">{applicant.id}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-medium">TIN</span>
            <span className="font-semibold text-slate-800">{applicant.tin}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-xs font-medium">Primary contact</span>
            <span className="text-slate-800">{applicant.primaryContact}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-medium">Email</span>
            <span className="text-slate-800 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {applicant.email}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-xs font-medium">Phone</span>
            <span className="text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {applicant.phone}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-medium">Registered address</span>
            <span className="text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {applicant.address}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-xs font-medium">Registered on</span>
            <span className="text-slate-800">{applicant.registeredDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-medium">Active services</span>
            <span className="text-slate-800">{applicant.activeServices}</span>
          </div>
        </div>
      </div>

      {/* KYC Document Checklist Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">KYC document checklist</h3>
          <p className="text-xs text-slate-500">All items must be verified before approval</p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
          {applicant.checklist?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
              <span className="text-sm font-medium text-slate-700">{item.name}</span>
              <div>{getStatusBadge(item.status)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Decision Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">Assessment decision</h3>
          <p className="text-xs text-slate-500">Recorded against the customer audit trail</p>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Assessor note — cite the licence, valuation or documentary basis for your decision."
          className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none placeholder:text-slate-400"
        />

        <div className="flex items-center gap-3 mt-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-sm font-medium transition-colors">
            <CheckCircle2 className="w-4 h-4" />
            Approve importer
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
            <RotateCcw className="w-4 h-4" />
            Return for revision
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
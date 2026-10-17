"use client";

import React, { useState } from "react";
import type { ApprovalApplicant } from "@/modules/assessor/assessor.type";
import {
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  RotateCcw,
  XCircle,
  FileText,
} from "lucide-react";

interface ApprovalDetailsProps {
  applicant: ApprovalApplicant;
  onApprove?: (id?: string, note?: string) => void;
  onRevision?: (id?: string, note?: string) => void;
  onReject?: (id?: string, note?: string) => void;
  onVerifyDocument?: (documentId: string, isVerified: boolean, note: string) => void;
  onDownloadDocument?: (documentId: string, fileName: string) => void;
  actionLoading?: boolean;
  documentDownloadId?: string | null;
  documentActionId?: string | null;
}

export function ApprovalDetails({
  applicant,
  onApprove,
  onRevision,
  onReject,
  onVerifyDocument,
  onDownloadDocument,
  actionLoading = false,
  documentDownloadId = null,
  documentActionId = null,
}: ApprovalDetailsProps) {
  const [note, setNote] = useState("");
  const checklist = applicant?.checklist ?? [];
  const hasUnverifiedDocuments = checklist.some(
    (item) => !item.isVerified && !item.isExpired,
  );
  const hasExpiredDocuments = checklist.some((item) => item.isExpired);
  const approvalBlocked = hasUnverifiedDocuments || hasExpiredDocuments;

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

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
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-800">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
            Expired
          </span>
        );
      case "Returned for revision":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
            Returned for revision
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-800">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
            Rejected
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
              {applicant.importerType}
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
            <span className="text-slate-500 block text-xs font-medium">Business license</span>
            <span className="text-slate-800">{applicant.licence}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-medium">Import license</span>
            <span className="text-slate-800">{applicant.importLicense}</span>
            {applicant.importLicenseExpiry && (
              <span className="mt-1 block text-xs text-slate-500">
                Expires {formatDate(applicant.importLicenseExpiry)}
              </span>
            )}
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-medium">Business address</span>
            <span className="text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {applicant.address}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-xs font-medium">Registered on</span>
            <span className="text-slate-800">{formatDate(applicant.registeredDate)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-medium">Active services</span>
            <span className="text-slate-800">{applicant.activeServices ?? "Not available"}</span>
          </div>
          {applicant.verificationNotes && (
            <p className="col-span-2 mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
              Previous review note: {applicant.verificationNotes}
            </p>
          )}
        </div>
      </div>

      {/* KYC Document Checklist Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">KYC document checklist</h3>
          <p className="text-xs text-slate-500">
            All active documents must be verified and unexpired before approval.
          </p>
        </div>

        {applicant.checklist.length === 0 ? (
          <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
            No active customer documents were returned by the backend.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100">
            {applicant.checklist.map((item) => {
              const numericDocumentId = Number(item.id);
              const hasDocumentId =
                Number.isSafeInteger(numericDocumentId) && numericDocumentId > 0;
              return (
                <div key={item.id} className="space-y-3 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="break-all">{item.name}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.documentType}
                        {item.isRequired ? " · Required by record" : " · Not marked required"}
                      </p>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>
                  <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                    <p>Submitted: {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "Not recorded"}</p>
                    <p>Expiry: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "Not recorded"}</p>
                  </div>
                  {item.verificationNotes && (
                    <p className="rounded bg-slate-50 p-2 text-xs text-slate-600">
                      Verification note: {item.verificationNotes}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {onDownloadDocument && (
                        <button
                          type="button"
                          onClick={() => onDownloadDocument(item.id, item.name)}
                          disabled={!hasDocumentId || documentDownloadId === item.id}
                          title={!hasDocumentId ? "This document has no valid backend ID." : undefined}
                          className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                        >
                          {documentDownloadId === item.id ? "Downloading…" : "Download file"}
                        </button>
                      )}
                      {onVerifyDocument && !item.isExpired && (
                        <button
                          type="button"
                          onClick={() => onVerifyDocument(item.id, !item.isVerified, note)}
                          disabled={!hasDocumentId || actionLoading || documentActionId === item.id}
                          title={!hasDocumentId ? "This document has no valid backend ID." : undefined}
                          className="rounded border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                        >
                          {documentActionId === item.id
                            ? "Saving…"
                            : item.isVerified
                              ? "Mark unverified"
                              : "Mark verified"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assessment Decision Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">Assessment decision</h3>
          <p className="text-xs text-slate-500">Decision notes are stored by the customer review API.</p>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Assessor note — cite the licence, valuation or documentary basis for your decision."
          className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none placeholder:text-slate-400"
        />

        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={() => onApprove?.(applicant.id, note)}
            disabled={actionLoading || approvalBlocked}
            title={
              approvalBlocked
                ? "Verify all active documents and resolve expired documents before approval."
                : undefined
            }
            className="flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve importer
          </button>
          <button
            type="button"
            onClick={() => onRevision?.(applicant.id, note)}
            disabled={actionLoading || !note.trim()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
            title={!note.trim() ? "A revision note is required" : undefined}
          >
            <RotateCcw className="w-4 h-4" />
            Return for revision
          </button>
          <button
            type="button"
            onClick={() => onReject?.(applicant.id, note)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reject customer
          </button>
        </div>
      </div>
    </div>
  );
}
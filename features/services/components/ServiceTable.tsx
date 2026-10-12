"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useServiceStore } from "../service.store";
import { useAssessorStore } from "@/modules/assessor/assessor.store";
import type { ServiceRecord, ServiceStatus, RiskChannel } from "../service.types";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Lock,
  CheckCircle2,
  RotateCcw,
  ArrowUpDown,
  LoaderCircle,
  MessageSquarePlus,
} from "lucide-react";

function ServiceRow({
  row,
  lang,
  renderStatusBadge,
  renderRiskBadge,
}: {
  row: ServiceRecord;
  lang: string;
  renderStatusBadge: (status: ServiceStatus) => React.ReactNode;
  renderRiskBadge: (channel: RiskChannel) => React.ReactNode;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const addComplianceFeedback = useAssessorStore((state) => state.addComplianceFeedback);
  const serviceId = Number(row.shipmentId ?? row.id);
  const canSubmit = Number.isInteger(serviceId) && serviceId > 0;

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !feedback.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await addComplianceFeedback({ shipmentId: serviceId, feedback: feedback.trim() });
      setFeedback("");
      setSuccess(true);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit compliance feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-slate-50/60 transition-colors">
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-2">
            {row.status === "Submitted" ? (
              <Link
                href={`/${lang}/admin/assessor/service-reviews/${row.shipmentId ?? row.id}`}
                className="font-semibold text-sky-700 hover:underline"
              >
                {row.id}
              </Link>
            ) : (
              <span className="font-semibold text-sky-700">{row.id}</span>
            )}
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                setFormOpen((open) => !open);
                setSuccess(false);
                setError(null);
              }}
              aria-label={`Send compliance feedback for ${row.id}`}
              title={canSubmit ? "Compliance feedback" : "Feedback unavailable: missing numeric service ID"}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-slate-500 text-[11px] block mt-0.5">
            {row.title}
          </span>
        </td>
        <td className="py-3.5 px-4">
          <span className="font-semibold text-slate-800 block">
            {row.importerName}
          </span>
          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
            {row.importerCode}
          </span>
        </td>
        <td className="py-3.5 px-4 text-slate-700 font-medium">{row.mode}</td>
        <td className="py-3.5 px-4">{renderStatusBadge(row.status)}</td>
        <td className="py-3.5 px-4">{renderRiskBadge(row.riskChannel)}</td>
        <td className="py-3.5 px-4 text-slate-800 font-medium">
          {row.caseExecutor}
        </td>
        <td className="py-3.5 px-4 text-slate-700">{row.eta}</td>
        <td className="py-3.5 px-4">
          <span
            className={`font-semibold ${
              row.isOverdue
                ? "text-rose-600"
                : row.sla === "Closed"
                ? "text-slate-400 font-normal"
                : "text-amber-700"
            }`}
          >
            {row.sla}
          </span>
        </td>
        <td className="py-3.5 px-4 text-slate-400">{row.updated}</td>
      </tr>
      {formOpen && (
        <tr>
          <td colSpan={9} className="bg-slate-50 px-4 py-3">
            <form onSubmit={(event) => void submitFeedback(event)} className="mx-auto max-w-2xl space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Compliance feedback
                <textarea
                  required
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
              {success && <p role="status" className="text-xs text-emerald-700">Feedback submitted to the service.</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {submitting && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                  {submitting ? "Submitting..." : "Submit feedback"}
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

export function ServiceTable() {
  const { lang } = useParams<{ lang: string }>();
  const getFilteredServices = useServiceStore((state) => state.getFilteredServices);
  const services = useServiceStore((state) => state.services);
  const loading = useServiceStore((state) => state.loading);
  const error = useServiceStore((state) => state.error);
  const filteredData = getFilteredServices();

  const renderStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case "In progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <RotateCcw className="w-3 h-3 text-sky-600 animate-spin-slow" />
            {status}
          </span>
        );
      case "Needs review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            {status}
          </span>
        );
      case "Requires customer action":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            {status}
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            {status}
          </span>
        );
      case "Blocked":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3 text-rose-500" />
            {status}
          </span>
        );
      case "Draft":
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
      case "Submitted":
      case "Under review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            {status}
          </span>
        );
      case "Approved":
      case "Completed":
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {status}
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3 text-rose-500" />
            {status}
          </span>
        );
      case "Unknown":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const renderRiskBadge = (channel: RiskChannel) => {
    switch (channel) {
      case "Green channel":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {channel}
          </span>
        );
      case "Yellow channel":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            {channel}
          </span>
        );
      case "Red channel":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
            <ShieldX className="w-3.5 h-3.5 text-rose-600" />
            {channel}
          </span>
        );
      case "Blue channel":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            {channel}
          </span>
        );
      case "Unassigned":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {channel}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {error && (
        <p role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">SERVICE</th>
              <th className="py-3 px-4">IMPORTER</th>
              <th className="py-3 px-4">MODE</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">RISK</th>
              <th className="py-3 px-4">CASE EXECUTOR</th>
              <th className="py-3 px-4">ETA</th>
              <th className="py-3 px-4">SLA</th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1 cursor-pointer">
                  UPDATED <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading && filteredData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading services...
                  </span>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                  {error
                    ? "Services could not be loaded."
                    : services.length === 0
                      ? "No service records are available in the database."
                      : "No services match your filters."}
                </td>
              </tr>
            ) : filteredData.map((row) => (
              <ServiceRow
                key={row.id}
                row={row}
                lang={lang}
                renderStatusBadge={renderStatusBadge}
                renderRiskBadge={renderRiskBadge}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredData.length} of {services.length} services</span>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-400 bg-slate-50 cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-2 font-medium text-slate-700">Page 1 of 1</span>
          <button
            disabled
            className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-400 bg-slate-50 cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
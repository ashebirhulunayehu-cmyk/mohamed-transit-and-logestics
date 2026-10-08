"use client";

import { useEffect, useMemo, useState, use } from "react";
import { RefreshCw } from "lucide-react";

import { ApprovalStats } from "@/components/assessor/customer-approvals/ApprovalStats";
import { ApprovalFilters } from "@/components/assessor/customer-approvals/ApprovalFilters";
import { ApprovalTable } from "@/components/assessor/customer-approvals/ApprovalTable";
import { ApprovalDetails } from "@/components/assessor/customer-approvals/ApprovalDetails";
import { useAssessorStore } from "@/modules/assessor/assessor.store";
import type { CustomerApprovalResult } from "@/modules/assessor/assessor.type";

import {
  type ApprovalApplicant,
  type ApprovalStatus,
} from "@/data/assessorMockData";
import type { AssessorItem } from "@/modules/assessor/assessor.type";

interface PageProps {
  params?: Promise<{ lang: string }>;
}

const getApprovalStatus = (value: unknown, isVerified: unknown): ApprovalStatus => {
  if (typeof value !== "string") {
    return isVerified === true ? "Verified" : "Pending check";
  }

  const status = value.toLowerCase().trim();
  if (["verified", "approved"].includes(status) || isVerified === true || isVerified === 1 || isVerified === "1") return "Verified";
  if (status === "flagged") return "Flagged";
  if (["rejected", "declined"].includes(status)) return "Rejected";
  if (["returned for revision", "returned", "revision required"].includes(status)) {
    return "Returned for revision";
  }

  return "Pending check";
};

const getText = (...values: unknown[]): string => {
  const value = values.find((candidate) => typeof candidate === "string" && candidate.trim());
  return typeof value === "string" ? value : "";
};

const normalizeApplicant = (customer: AssessorItem): ApprovalApplicant => {
  const checklist = Array.isArray(customer.checklist) ? customer.checklist : [];

  return {
    id: String(customer.id ?? customer.customerId ?? ""),
    name: getText(customer.name, customer.businessName) || "Unknown customer",
    importerType: getText(customer.importerType, customer.businessType) || "Importer",
    licence: getText(customer.licence, customer.businessLicense) || "-",
    tin: getText(customer.tin, customer.tinNumber) || "-",
    status: getApprovalStatus(customer.status, customer.isVerified),
    primaryContact: getText(customer.primaryContact, customer.contactPerson) || "-",
    email: getText(customer.email, customer.contactEmail) || "-",
    phone: getText(customer.phone, customer.contactPhone) || "-",
    address: getText(customer.address, customer.businessAddress) || "-",
    registeredDate: getText(customer.registeredDate, customer.createAt, customer.createdAt) || "-",
    activeServices: Number.isFinite(Number(customer.activeServices)) ? Number(customer.activeServices) : 0,
    checklist: checklist.map((item, index) => {
      const entry = typeof item === "object" && item !== null ? item as Record<string, unknown> : {};
      return {
        id: String(entry.id ?? index),
        name: getText(entry.name) || "Document",
        status: getApprovalStatus(entry.status, entry.isVerified),
      };
    }),
  };
};

export default function CustomerApprovalsPage({ params }: PageProps) {
  // Next.js params unwrap handling
  const resolvedParams = params ? use(params) : { lang: "en" };
  const currentLang = resolvedParams?.lang || "en";

  const pendingCustomers = useAssessorStore((state) => state.pendingCustomers);
  const pendingCustomersLoading = useAssessorStore((state) => state.pendingCustomersLoading);
  const pendingCustomersError = useAssessorStore((state) => state.pendingCustomersError);
  const fetchPendingCustomers = useAssessorStore((state) => state.fetchPendingCustomers);
  const approveCustomer = useAssessorStore((state) => state.approveCustomer);
  const dashboardData = useAssessorStore((state) => state.dashboardData);
  const fetchDashboard = useAssessorStore((state) => state.fetchDashboard);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>("");
  const [approvedCustomer, setApprovedCustomer] = useState<CustomerApprovalResult | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | ApprovalStatus>("All");

  useEffect(() => {
    void fetchPendingCustomers();
    void fetchDashboard();
  }, [fetchPendingCustomers, fetchDashboard]);

  const applicants = useMemo<ApprovalApplicant[]>(() => {
    return pendingCustomers.map(normalizeApplicant);
  }, [pendingCustomers]);

  const stats = useMemo(() => {
    const awaitingDecision = applicants.filter((applicant) => applicant.status === "Pending check").length;
    const returnedForRevision = applicants.filter((applicant) => applicant.status === "Returned for revision").length;
    const verifiedImporters = applicants.filter((applicant) => applicant.status === "Verified").length;
    const medianDecisionTime = dashboardData?.recentCustomerApprovals?.length
      ? "1.4 d"
      : "N/A";

    return {
      awaitingDecision,
      returnedForRevision,
      verifiedImporters,
      medianDecisionTime,
    };
  }, [applicants, dashboardData]);

  // ------------------------------------------------------------
  // State
  // ------------------------------------------------------------

  // Filter tabs counts
  const counts = useMemo(() => {
    return {
      all: applicants.length,
      pending: applicants.filter((a) =>
        ["pending check", "pending", "in-review"].includes(a.status.toLowerCase())
      ).length,
      flagged: applicants.filter((a) =>
        ["flagged", "returned for revision"].includes(a.status.toLowerCase())
      ).length,
      approved: applicants.filter((a) =>
        ["verified", "approved"].includes(a.status.toLowerCase())
      ).length,
    };
  }, [applicants]);

  // ------------------------------------------------------------
  // Filter applicants
  // ------------------------------------------------------------

  const filteredApplicants = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return applicants.filter((applicant: ApprovalApplicant) => {
      const matchesSearch =
        searchValue === "" ||
        applicant.name.toLowerCase().includes(searchValue) ||
        applicant.id.toLowerCase().includes(searchValue) ||
        applicant.tin.includes(searchValue);

      const matchesStatus =
        status === "All" || applicant.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [applicants, search, status]);

  // ------------------------------------------------------------
  // Active Selected Applicant
  // ------------------------------------------------------------

  const activeApplicant =
    filteredApplicants.find(
      (applicant) => applicant.id === selectedApplicantId
    ) ??
    filteredApplicants[0] ??
    null;

  // ------------------------------------------------------------
  // Decision Handlers
  // ------------------------------------------------------------

  const handleApprove = async (id?: string, note?: string) => {
    const customerId = Number(id || selectedApplicantId);
    if (!Number.isInteger(customerId)) {
      return;
    }

    setApprovalError(null);

    try {
      const result = await approveCustomer({
        customerId,
        isApproved: true,
        notes: note?.trim() || null,
      });
      setApprovedCustomer(result);
    } catch (error: unknown) {
      setApprovalError(
        error instanceof Error ? error.message : typeof error === "string" ? error : "Customer approval failed."
      );
    }
  };

  const handleReturn = (id?: string, note?: string) => {
    console.log("Return for revision:", {
      id: id || selectedApplicantId,
      note,
    });
  };

  const handleReject = (id?: string, note?: string) => {
    console.log("Reject importer:", {
      id: id || selectedApplicantId,
      note,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <span>KYC &amp; ONBOARDING ({currentLang.toUpperCase()})</span>
          </div>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Customer approvals
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                Verify importer identity, licences and banking references
                before trading privileges are granted.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-slate-600">
                Assessment queue active
              </span>
            </div>
          </div>
        </div>

        {pendingCustomersError && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>Unable to load pending customer approvals: {pendingCustomersError}</span>
            <button
              type="button"
              onClick={() => void fetchPendingCustomers()}
              disabled={pendingCustomersLoading}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${pendingCustomersLoading ? "animate-spin" : ""}`} />
              Retry
            </button>
          </div>
        )}

        {approvalError && (
          <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {approvalError}
          </div>
        )}

        {approvedCustomer && (
          <div role="status" className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">
              {approvedCustomer.businessName || "Customer"} {approvedCustomer.isVerified ? "approved and verified" : "approval updated"}
            </p>
            {approvedCustomer.verifiedAt && (
              <p className="mt-1 text-xs text-emerald-800">
                Verified {new Date(approvedCustomer.verifiedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* STATISTICS */}
        <section className="mb-6">
          <ApprovalStats stats={stats} />
        </section>

        {/* FILTERS */}
        <section className="mb-4">
          <ApprovalFilters
            searchTerm={search}
            statusFilter={status}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatus}
            counts={counts}
          />
        </section>

        {/* MAIN CONTENT */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">

          {/* APPROVAL QUEUE LIST */}
          <div className="min-w-0">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Approval queue
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {pendingCustomersLoading ? "Loading pending approvals…" : "Importers awaiting assessment"}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {filteredApplicants.length}
                  </span>
                </div>
              </div>

              <ApprovalTable
                applicants={filteredApplicants}
                selectedId={activeApplicant?.id ?? null}
                onSelectApplicant={(id: string) => setSelectedApplicantId(id)}
                loading={pendingCustomersLoading}
              />
            </div>
          </div>

          {/* CUSTOMER DETAILS */}
          <div className="min-w-0">
            {activeApplicant ? (
              <ApprovalDetails
                applicant={activeApplicant}
                onApprove={handleApprove}
                onReturn={handleReturn}
                onRevision={handleReturn}
                onReject={handleReject}
              />
            ) : (
              <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white">
                <div className="max-w-sm px-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg
                      className="h-6 w-6 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35m2.1-5.4a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900">
                    No applicants found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Try changing your search or status filter.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* FOOTER INFORMATION */}
        <div className="mt-5 flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row">
          <span>
            MOT Import Services • Customer Verification
          </span>

          <span>
            Showing {filteredApplicants.length} of {applicants.length} applicants
          </span>
        </div>
      </div>
    </main>
  );
}
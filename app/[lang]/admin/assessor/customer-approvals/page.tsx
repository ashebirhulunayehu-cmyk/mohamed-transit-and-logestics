"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { ApprovalStats } from "@/components/assessor/customer-approvals/ApprovalStats";
import { ApprovalFilters } from "@/components/assessor/customer-approvals/ApprovalFilters";
import { ApprovalTable } from "@/components/assessor/customer-approvals/ApprovalTable";
import { ApprovalDetails } from "@/components/assessor/customer-approvals/ApprovalDetails";
import { useAssessorStore } from "@/modules/assessor/assessor.store";
import { useAuthStore } from "@/modules/auth/auth.store";
import type {
  ApprovalApplicant,
  ApprovalStatus,
} from "@/modules/assessor/assessor.type";
import type { AssessorItem } from "@/modules/assessor/assessor.type";

interface PageProps {
  params?: Promise<{ lang: string }>;
}

const getText = (...values: unknown[]): string => {
  const value = values.find((candidate) => typeof candidate === "string" && candidate.trim());
  return typeof value === "string" ? value : "";
};

const getBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && (value === 0 || value === 1)) {
    return value === 1;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return undefined;
};

const normalizeApprovalStatus = (customer: AssessorItem): ApprovalStatus => {
  const returnedForRevision = getBoolean(
    customer.isReturnedForRevision ?? customer.returnedForRevision,
  );
  if (returnedForRevision) return "Returned for revision";

  const rawStatus = getText(
    customer.approvalStatus,
    customer.verificationStatus,
    customer.kycStatus,
    customer.status,
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (
    ["returned", "returnedforrevision", "revisionrequired", "needsrevision"].includes(
      rawStatus,
    )
  ) {
    return "Returned for revision";
  }
  if (["flagged", "requiresattention"].includes(rawStatus)) return "Flagged";
  if (["verified", "approved", "complete", "completed"].includes(rawStatus)) {
    return "Verified";
  }
  if (["rejected", "declined"].includes(rawStatus)) return "Rejected";
  if (rawStatus === "expired") return "Expired";
  if (
    [
      "pending",
      "pendingcheck",
      "pendingverification",
      "submitted",
      "inreview",
      "awaitingreview",
    ].includes(rawStatus)
  ) {
    return "Pending check";
  }
  if (getBoolean(customer.isFlagged) === true) return "Flagged";
  if (getBoolean(customer.isVerified) === true) return "Verified";
  return "Pending check";
};

const documentTypeNames: Record<number, string> = {
  1: "Invoice",
  2: "Bank receipt",
  3: "Delivery order",
  4: "Inspection report",
  5: "Clearance document",
  6: "Transport license",
  7: "Arrival photo",
  8: "Store receipt",
  9: "Legal document",
  10: "Other",
};

const normalizeApplicant = (customer: AssessorItem): ApprovalApplicant => {
  const documents = Array.isArray(customer.documents)
    ? customer.documents.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
    : [];
  const isReturnedForRevision =
    normalizeApprovalStatus(customer) === "Returned for revision";
  const rawActiveServices =
    customer.activeServices === null || customer.activeServices === undefined
      ? Number.NaN
      : Number(customer.activeServices);

  return {
    id: String(customer.id ?? customer.customerId ?? ""),
    name: getText(customer.name, customer.businessName) || "Unknown customer",
    importerType: getText(customer.businessType) || "Importer",
    licence: getText(customer.businessLicense) || "-",
    importLicense: getText(customer.importLicense) || "-",
    importLicenseExpiry: getText(customer.importLicenseExpiry) || null,
    tin: getText(customer.tinNumber) || "-",
    status: normalizeApprovalStatus(customer),
    verificationNotes: getText(customer.verificationNotes) || null,
    primaryContact: getText(customer.primaryContact, customer.contactPerson) || "-",
    email: getText(customer.contactEmail) || "-",
    phone: getText(customer.contactPhone) || "-",
    address: getText(customer.businessAddress) || "-",
    registeredDate:
      getText(
        customer.registeredDate,
        customer.registrationDate,
        customer.createdAt,
        customer.createAt,
      ) || "-",
    activeServices: Number.isFinite(rawActiveServices)
      ? rawActiveServices
      : null,
    isReturnedForRevision,
    checklist: documents.map((entry, index) => {
      const expiryDate = getText(entry.expiryDate) || null;
      const isExpired =
        getBoolean(entry.isExpired) === true ||
        Boolean(expiryDate && new Date(expiryDate).getTime() < Date.now());
      const documentStatus = normalizeApprovalStatus(entry);
      const isVerified =
        getBoolean(entry.isVerified) === true || documentStatus === "Verified";
      const rawType = entry.documentType;
      const typeCode = typeof rawType === "number" ? rawType : Number(rawType);
      const documentType =
        documentTypeNames[typeCode] ??
        (typeof rawType === "string" ? rawType : "Document");
      return {
        id: String(entry.id ?? index),
        name: getText(entry.originalFileName) || documentType,
        documentType,
        status: isExpired
          ? "Expired"
          : documentStatus,
        isRequired: getBoolean(entry.isRequired) === true,
        isVerified,
        expiryDate,
        isExpired,
        verificationNotes: getText(entry.verificationNotes) || null,
        submittedAt: getText(entry.createAt) || null,
      };
    }),
  };
};

const normalizeRole = (value: unknown): string => {
  if (!value) return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const role = normalizeRole(item);
      if (role) return role;
    }
    return "";
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase().replace(/[^a-z]/g, "");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return normalizeRole(
      record.role ??
        record.roleName ??
        record.userType ??
        record.accountType ??
        record.name ??
        record.userRoles ??
        record.roles,
    );
  }

  return "";
};

export default function CustomerApprovalsPage({ params }: PageProps) {
  // Next.js params unwrap handling
  const resolvedParams = params ? use(params) : { lang: "en" };
  const currentLang = resolvedParams?.lang || "en";
  const router = useRouter();

  const authUser = useAuthStore((state) => state.user);
  const userRole = normalizeRole(
    authUser?.roleName ??
      authUser?.roles ??
      authUser?.userRoles ??
      "",
  );

  const pendingCustomers = useAssessorStore((state) => state.pendingCustomers);
  const pendingCustomersLoading = useAssessorStore((state) => state.pendingCustomersLoading);
  const pendingCustomersError = useAssessorStore((state) => state.pendingCustomersError);
  const fetchPendingCustomers = useAssessorStore((state) => state.fetchPendingCustomers);
  const approveCustomer = useAssessorStore((state) => state.approveCustomer);
  const verifyCustomerDocument = useAssessorStore((state) => state.verifyCustomerDocument);
  const downloadCustomerDocument = useAssessorStore((state) => state.downloadCustomerDocument);
  const actionLoading = useAssessorStore((state) => state.loading);
  const dashboardData = useAssessorStore((state) => state.dashboardData);
  const fetchDashboard = useAssessorStore((state) => state.fetchDashboard);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [documentActionId, setDocumentActionId] = useState<string | null>(null);
  const [documentDownloadId, setDocumentDownloadId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | ApprovalStatus>("All");

  useEffect(() => {
    const hasAssessorAccess = ["assessor", "admin", "superadmin"].includes(userRole);

    if (!hasAssessorAccess) {
      const nextRoute = userRole === "manager" ? `/${currentLang}/admin/dashboard?role=manager` : `/${currentLang}/admin/dashboard?role=assessor`;
      router.replace(nextRoute);
      return;
    }

    void fetchPendingCustomers();
    void fetchDashboard();
  }, [fetchPendingCustomers, fetchDashboard, router, currentLang, userRole]);

  const applicants = useMemo<ApprovalApplicant[]>(() => {
    return pendingCustomers.map(normalizeApplicant);
  }, [pendingCustomers]);

  const stats = useMemo(() => {
    const awaitingDecision = applicants.filter(
      (applicant) => applicant.status === "Pending check",
    ).length;
    const returnedForRevision = applicants.filter(
      (applicant) => applicant.status === "Returned for revision",
    ).length;
    const verifiedImporters = dashboardData?.verifiedCustomers ?? 0;
    const medianDecisionTime =
      dashboardData?.medianCustomerDecisionDays == null
        ? "N/A"
        : `${dashboardData.medianCustomerDecisionDays.toFixed(1)} d`;

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
      pending: applicants.filter((a) => a.status === "Pending check").length,
      returned: applicants.filter(
        (a) => a.status === "Returned for revision",
      ).length,
      flagged: applicants.filter((a) => a.status === "Flagged").length,
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

  const submitCustomerDecision = async (
    id: string | undefined,
    note: string | undefined,
    isApproved: boolean,
    returnForRevision: boolean,
  ) => {
    const customerId = Number(id || selectedApplicantId);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      setApprovalError("The selected customer has an invalid ID.");
      return;
    }
    if (returnForRevision && !note?.trim()) {
      setApprovalError("A note is required when returning a customer for revision.");
      return;
    }

    setApprovalError(null);
    setActionMessage(null);

    try {
      await approveCustomer({
        customerId,
        isApproved,
        notes: note?.trim() || null,
        returnForRevision,
      });
      setActionMessage(
        returnForRevision
          ? "Customer returned for revision."
          : isApproved
            ? "Customer approved."
            : "Customer rejected.",
      );
    } catch (error: unknown) {
      setApprovalError(
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Customer review failed.",
      );
    }
  };

  const handleApprove = (id?: string, note?: string) =>
    submitCustomerDecision(id, note, true, false);

  const handleReturn = (id?: string, note?: string) =>
    submitCustomerDecision(id, note, false, true);

  const handleReject = (id?: string, note?: string) =>
    submitCustomerDecision(id, note, false, false);

  const handleVerifyDocument = async (
    documentId: string,
    isVerified: boolean,
    note: string,
  ) => {
    const numericDocumentId = Number(documentId);
    if (!Number.isInteger(numericDocumentId) || numericDocumentId <= 0) {
      setApprovalError("The selected document has an invalid ID.");
      return;
    }

    setApprovalError(null);
    setActionMessage(null);
    setDocumentActionId(documentId);
    try {
      await verifyCustomerDocument({
        documentId: numericDocumentId,
        isVerified,
        notes: note.trim() || undefined,
      });
      setActionMessage(
        isVerified ? "Customer document verified." : "Customer document marked unverified.",
      );
    } catch (error: unknown) {
      setApprovalError(
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Customer document verification failed.",
      );
    } finally {
      setDocumentActionId(null);
    }
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    const numericDocumentId = Number(documentId);
    if (!Number.isInteger(numericDocumentId) || numericDocumentId <= 0) {
      setApprovalError("The selected document has an invalid ID.");
      return;
    }

    setApprovalError(null);
    setActionMessage(null);
    setDocumentDownloadId(documentId);
    try {
      const blob = await downloadCustomerDocument(numericDocumentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `customer-document-${documentId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: unknown) {
      setApprovalError(
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Customer document download failed.",
      );
    } finally {
      setDocumentDownloadId(null);
    }
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

        {actionMessage && (
          <div role="status" className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {actionMessage}
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
                      {pendingCustomersLoading
                        ? "Loading customer approvals…"
                        : "Select an importer to review"}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {filteredApplicants.length}
                  </span>
                </div>
              </div>

              <ApprovalTable
                applicants={filteredApplicants.map((applicant) => ({
                  id: applicant.id,
                  name: applicant.name,
                  tin: applicant.tin,
                  registeredDate: applicant.registeredDate,
                  status: applicant.status,
                  activeServices: applicant.activeServices,
                }))}
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
                key={activeApplicant.id}
                applicant={activeApplicant}
                onApprove={handleApprove}
                onRevision={handleReturn}
                onReject={handleReject}
                onVerifyDocument={handleVerifyDocument}
                onDownloadDocument={handleDownloadDocument}
                actionLoading={actionLoading}
                documentDownloadId={documentDownloadId}
                documentActionId={documentActionId}
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
"use client";

import { useMemo, useState, use } from "react";

import { ApprovalStats } from "@/components/assessor/customer-approvals/ApprovalStats";
import { ApprovalFilters } from "@/components/assessor/customer-approvals/ApprovalFilters";
import { ApprovalTable } from "@/components/assessor/customer-approvals/ApprovalTable";
import { ApprovalDetails } from "@/components/assessor/customer-approvals/ApprovalDetails";

import {
  mockApplicants,
  mockStats,
  type ApprovalApplicant,
  type ApprovalStatus,
} from "@/data/assessorMockData";

interface PageProps {
  params?: Promise<{ lang: string }>;
}

export default function CustomerApprovalsPage({ params }: PageProps) {
  // Next.js params unwrap handling
  const resolvedParams = params ? use(params) : { lang: "en" };
  const currentLang = resolvedParams?.lang || "en";

  // ------------------------------------------------------------
  // State
  // ------------------------------------------------------------

  const [selectedApplicantId, setSelectedApplicantId] = useState<string>(
    mockApplicants[0]?.id ?? ""
  );

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | ApprovalStatus>("All");

  // Filter tabs counts
  const counts = useMemo(() => {
    return {
      all: mockApplicants.length,
      pending: mockApplicants.filter((a) =>
        ["pending check", "pending", "in-review"].includes(a.status.toLowerCase())
      ).length,
      flagged: mockApplicants.filter((a) =>
        ["flagged", "returned for revision"].includes(a.status.toLowerCase())
      ).length,
      approved: mockApplicants.filter((a) =>
        ["verified", "approved"].includes(a.status.toLowerCase())
      ).length,
    };
  }, []);

  // ------------------------------------------------------------
  // Filter applicants
  // ------------------------------------------------------------

  const filteredApplicants = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return mockApplicants.filter((applicant: ApprovalApplicant) => {
      const matchesSearch =
        searchValue === "" ||
        applicant.name.toLowerCase().includes(searchValue) ||
        applicant.id.toLowerCase().includes(searchValue) ||
        applicant.tin.includes(searchValue);

      const matchesStatus =
        status === "All" || applicant.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

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

  const handleApprove = (id?: string, note?: string) => {
    console.log("Approve importer:", {
      id: id || selectedApplicantId,
      note,
    });
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

        {/* STATISTICS */}
        <section className="mb-6">
          <ApprovalStats stats={mockStats} />
        </section>

        {/* FILTERS */}
        <section className="mb-4">
          <ApprovalFilters
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
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
                      Importers awaiting assessment
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {filteredApplicants.length}
                  </span>
                </div>
              </div>

              <ApprovalTable
                applicants={filteredApplicants}
                selectedApplicantId={activeApplicant?.id ?? null}
                onSelectApplicant={(applicant: ApprovalApplicant) =>
                  setSelectedApplicantId(applicant.id)
                }
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
            Showing {filteredApplicants.length} of {mockApplicants.length} applicants
          </span>
        </div>
      </div>
    </main>
  );
}
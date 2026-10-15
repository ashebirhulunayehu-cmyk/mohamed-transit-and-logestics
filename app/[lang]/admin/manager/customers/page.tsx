"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Users } from "lucide-react";
import { useManagerStore } from "@/modules/manager/manager.store";
import type { ManagerExecutorAssignment } from "@/modules/manager/manager.type";

const getCustomerName = (customer: {
  contactPerson?: string | null;
  user?: { firstName?: string | null; lastName?: string | null } | null;
}): string =>
  customer.contactPerson ||
  [customer.user?.firstName, customer.user?.lastName].filter(Boolean).join(" ") ||
  "—";

const formatRegisteredDate = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
};

const isActiveCase = (status: number | string | null | undefined): boolean => {
  if (status === null || status === undefined || status === "") return false;

  const normalized = String(status).trim().toLowerCase();
  const numericStatus = Number(normalized);
  if (Number.isInteger(numericStatus)) {
    return numericStatus >= 1 && numericStatus <= 5;
  }

  return [
    "draft",
    "submitted",
    "under review",
    "approved",
    "in progress",
    "pending",
    "needs review",
    "requires customer action",
    "blocked",
  ].includes(normalized);
};

const hasCustomerCase = (
  service: ManagerExecutorAssignment,
  customer: { id: number | string; userId?: number | string | null },
): boolean =>
  (service.customerId !== null &&
    service.customerId !== undefined &&
    String(service.customerId) === String(customer.id)) ||
  (service.importerId !== null &&
    service.importerId !== undefined &&
    customer.userId !== null &&
    customer.userId !== undefined &&
    String(service.importerId) === String(customer.userId));

export default function CustomerManagementPage() {
  const {
    customers,
    customerPagination,
    customersLoading,
    customersError,
    fetchCustomers,
    fetchServices,
  } = useManagerStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [caseRecords, setCaseRecords] = useState<ManagerExecutorAssignment[] | null>(null);
  const [caseRecordsLoading, setCaseRecordsLoading] = useState(true);
  const [caseRecordsError, setCaseRecordsError] = useState<string | null>(null);

  useEffect(() => {
    void fetchCustomers({ page, pageSize });
  }, [fetchCustomers, page, pageSize]);

  const loadCaseRecords = useCallback(async () => {
    setCaseRecordsLoading(true);
    setCaseRecordsError(null);

    try {
      const allRecords: ManagerExecutorAssignment[] = [];
      const firstPage = await fetchServices({ page: 1, pageSize: 100 });
      const firstPageState = useManagerStore.getState();
      if (firstPageState.error) throw new Error(firstPageState.error);
      allRecords.push(...firstPage);

      for (let currentPage = 2; currentPage <= firstPageState.servicePagination.totalPages; currentPage += 1) {
        const records = await fetchServices({ page: currentPage, pageSize: 100 });
        const pageState = useManagerStore.getState();
        if (pageState.error) throw new Error(pageState.error);
        allRecords.push(...records);
      }

      setCaseRecords(allRecords);
    } catch (error: unknown) {
      setCaseRecords(null);
      setCaseRecordsError(
        error instanceof Error ? error.message : "Failed to load customer case counts.",
      );
    } finally {
      setCaseRecordsLoading(false);
    }
  }, [fetchServices]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCaseRecords();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCaseRecords]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => {
      const searchableValues = [
        customer.businessName,
        customer.tinNumber,
        customer.businessType,
        customer.contactPerson,
        customer.contactPhone,
        customer.contactEmail,
        customer.user?.username,
        customer.user?.firstName,
        customer.user?.lastName,
        customer.user?.email,
        customer.user?.phone,
      ];
      return searchableValues.some(
        (value) => typeof value === "string" && value.toLowerCase().includes(query),
      );
    });
  }, [customers, search]);

  return (
    <main className="mx-auto max-w-[1500px] space-y-5 text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Registry
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registered importers, their KYC state and active caseload.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void fetchCustomers({ page, pageSize });
            void loadCaseRecords();
          }}
          disabled={customersLoading || caseRecordsLoading}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${customersLoading || caseRecordsLoading ? "animate-spin" : ""}`}
          />
          Refresh customers
        </button>
      </header>

      {customersError && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Unable to load customers: {customersError}
        </p>
      )}
      {caseRecordsError && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Unable to load active case counts: {caseRecordsError}
        </p>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Customer records</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredCustomers.length.toLocaleString()} shown
              {customerPagination.totalCount
                ? ` of ${customerPagination.totalCount.toLocaleString()}`
                : ""}
            </p>
          </div>
          <label className="relative block w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search importer, TIN, contact, email..."
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {customersLoading && !customers.length ? (
          <p role="status" className="px-4 py-12 text-center text-sm text-slate-500">
            Loading customer records...
          </p>
        ) : filteredCustomers.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Importer</th>
                  <th className="px-4 py-3">TIN</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">KYC</th>
                  <th className="px-4 py-3">Active cases</th>
                  <th className="px-4 py-3">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => {
                  const activeCases = caseRecords?.filter(
                    (service) =>
                      isActiveCase(service.status) && hasCustomerCase(service, customer),
                  ).length;
                  const contactEmail = customer.contactEmail || customer.user?.email;

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{customer.businessName || "—"}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {getCustomerName(customer)}
                          {contactEmail ? ` · ${contactEmail}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{customer.tinNumber || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{customer.businessType || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            customer.isVerified
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {customer.isVerified ? "Verified" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">
                        {caseRecordsLoading && caseRecords === null
                          ? "…"
                          : activeCases?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatRegisteredDate(customer.createAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center text-slate-500">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Users className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium">
              {search
                ? "No customers match your search."
                : "No customer records were returned by the manager API."}
            </p>
          </div>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
          <p className="text-xs text-slate-500">
            Page {customerPagination.page} of {Math.max(customerPagination.totalPages, 1)}
            {" · "}
            {customerPagination.totalCount.toLocaleString()} total customers
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={customersLoading || customerPagination.page <= 1}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(customerPagination.totalPages, current + 1))}
                disabled={
                  customersLoading ||
                  customerPagination.totalPages === 0 ||
                  customerPagination.page >= customerPagination.totalPages
                }
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}

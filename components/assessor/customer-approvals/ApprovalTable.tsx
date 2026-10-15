import React from "react";
import { StatusBadge } from "./StatusBadge";
import { Building2, Calendar, ChevronRight } from "lucide-react";

interface Applicant {
  id: string;
  name: string;
  tin: string;
  registeredDate: string;
  status: string;
  activeServices: number | null;
}

interface ApprovalTableProps {
  applicants: Applicant[];
  selectedId: string | null;
  onSelectApplicant: (id: string) => void;
  loading?: boolean;
}

export const ApprovalTable: React.FC<ApprovalTableProps> = ({
  applicants,
  selectedId,
  onSelectApplicant,
  loading = false,
}) => {
  return (
    <div className="max-h-[720px] space-y-2 overflow-y-auto p-3">
      {applicants.length === 0 ? (
        <p className="px-3 py-8 text-center text-xs text-slate-400">
          {loading
            ? "Loading pending customer approvals…"
            : "No approval requests found matching your filter."}
        </p>
      ) : (
        applicants.map((item) => {
          const isSelected = selectedId === item.id;
          const registeredDate = new Date(item.registeredDate);
          const formattedDate = Number.isNaN(registeredDate.getTime())
            ? item.registeredDate
            : registeredDate.toLocaleDateString();

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectApplicant(item.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-blue-200 bg-blue-50/70"
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-0.5 rounded-lg p-2 ${
                      isSelected
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Building2 aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      TIN: {item.tin}
                    </span>
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className={`mt-1 h-4 w-4 shrink-0 ${
                    isSelected ? "text-blue-600" : "text-slate-400"
                  }`}
                />
              </span>

              <span className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
                  {formattedDate}
                </span>
                <StatusBadge status={item.status} />
              </span>
              <span className="mt-2 block text-xs text-slate-500">
                Customer ID: <span className="font-medium text-slate-700">{item.id}</span>
                {item.activeServices !== null &&
                  ` · ${item.activeServices} active services`}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
};
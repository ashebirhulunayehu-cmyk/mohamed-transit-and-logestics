import React from 'react';
import { StatusBadge } from './StatusBadge';
import { ChevronRight, Building2, Calendar, FileText } from 'lucide-react';

interface Applicant {
  id: string;
  name: string;
  tin: string;
  registeredDate: string;
  status: string;
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
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          Approval Queue ({applicants.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-100 font-semibold">
            <tr>
              <th className="py-3 px-4">Applicant / TIN</th>
              <th className="py-3 px-4">Customer ID</th>
              <th className="py-3 px-4">Registered Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applicants.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  {loading
                    ? "Loading pending customer approvals…"
                    : "No approval requests found matching your filter."}
                </td>
              </tr>
            ) : (
              applicants.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectApplicant(item.id)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-blue-50/50 hover:bg-blue-50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">TIN: {item.tin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-600">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.registeredDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        className={`p-1.5 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
import React from 'react';
import type { ApprovalCounts, ApprovalFilterStatus } from '@/modules/assessor/assessor.type';
import { Search } from 'lucide-react';

interface ApprovalFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: ApprovalFilterStatus;
  onStatusFilterChange: React.Dispatch<React.SetStateAction<ApprovalFilterStatus>>;
  counts: ApprovalCounts;
}

export const ApprovalFilters: React.FC<ApprovalFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  counts,
}) => {
  const filterTabs: { id: ApprovalFilterStatus; label: string; count: number }[] = [
    { id: 'All', label: 'All Applicants', count: counts.all },
    { id: 'Pending check', label: 'Pending Check', count: counts.pending },
    { id: 'Returned for revision', label: 'Returned for revision', count: counts.returned },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-6 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, TIN, or ID..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
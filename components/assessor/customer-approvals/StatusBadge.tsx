import React from 'react';

type StatusType = 'Pending check' | 'Flagged' | 'Verified' | 'Approved' | 'Rejected' | string;

export const StatusBadge: React.FC<{ status: StatusType }> = ({ status }) => {
  const getStyle = (st: string) => {
    switch (st.toLowerCase()) {
      case 'pending check':
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200/80 dot-amber-500';
      case 'flagged':
        return 'bg-rose-50 text-rose-700 border-rose-200/80 dot-rose-500';
      case 'verified':
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dot-emerald-500';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dot-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
};
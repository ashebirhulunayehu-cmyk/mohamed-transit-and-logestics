import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'In Progress':
      case 'In Review':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  return (
    <span
      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
};

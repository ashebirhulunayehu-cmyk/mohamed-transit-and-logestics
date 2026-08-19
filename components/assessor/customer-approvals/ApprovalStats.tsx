import React from 'react';
import { Clock, CheckCircle2, RotateCcw, FileText } from 'lucide-react';

interface StatsProps {
  stats: {
    awaitingDecision: number;
    returnedForRevision: number;
    verifiedImporters: number;
    medianDecisionTime: string;
  };
}

export const ApprovalStats: React.FC<StatsProps> = ({ stats }) => {
  const items = [
    {
      title: 'Awaiting Decision',
      value: stats.awaitingDecision,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-l-amber-500',
    },
    {
      title: 'Returned for Revision',
      value: stats.returnedForRevision,
      icon: RotateCcw,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-l-blue-500',
    },
    {
      title: 'Verified Importers',
      value: stats.verifiedImporters,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-l-emerald-500',
    },
    {
      title: 'Median Decision Time',
      value: stats.medianDecisionTime,
      subtext: 'last 30 days',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-l-indigo-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${item.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {item.title}
              </span>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{item.value}</span>
              {item.subtext && (
                <span className="text-xs text-slate-500 font-medium">{item.subtext}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
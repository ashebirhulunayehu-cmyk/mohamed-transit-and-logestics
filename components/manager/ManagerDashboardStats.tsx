import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ManagerStats } from '@/store/managerStore';

interface ManagerDashboardStatsProps {
  stats: ManagerStats;
}

export const ManagerDashboardStats: React.FC<ManagerDashboardStatsProps> = ({
  stats,
}) => {
  const items = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-l-blue-500',
    },
    {
      title: 'Active Cases',
      value: stats.activeCases,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-l-emerald-500',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingApproval,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-l-amber-500',
    },
    {
      title: 'Overdue Cases',
      value: stats.overdueCases,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-l-red-500',
    },
    {
      title: 'Completed',
      value: stats.completedCases,
      icon: CheckCircle2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-l-indigo-500',
    },
    {
      title: 'Avg Resolution Time',
      value: stats.averageResolutionTime,
      subtext: 'per case',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-l-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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

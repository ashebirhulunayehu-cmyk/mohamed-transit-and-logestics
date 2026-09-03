"use client";

import React from "react";
import { Database, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface DashboardStat {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "red" | "orange" | "emerald";
}

interface ManagerDashboardStatCardsProps {
  stats: any; // From store
}

export const ManagerDashboardStatCards: React.FC<ManagerDashboardStatCardsProps> = ({ stats }) => {
  const defaultStats: DashboardStat[] = [
    {
      title: "Open cases",
      value: stats?.activeCases || 5,
      description: "risk or review",
      icon: <Database className="w-5 h-5 text-blue-600" />,
      color: "blue" as const,
    },
    {
      title: "Needs attention",
      value: stats?.pendingApproval || 4,
      description: "risk or review",
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      color: "red" as const,
    },
    {
      title: "Due within 48h",
      value: stats?.overdueCases || 3,
      description: "pending approval",
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      color: "orange" as const,
    },
    {
      title: "Cleared this month",
      value: stats?.completedCases || 1,
      description: "completed",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      color: "emerald" as const,
    },
  ];

  const getColors = (color: string) => {
    switch (color) {
      case "red":
        return {
          border: "border-l-red-500",
          icon: "bg-red-50",
        };
      case "orange":
        return {
          border: "border-l-orange-500",
          icon: "bg-orange-50",
        };
      case "emerald":
        return {
          border: "border-l-emerald-500",
          icon: "bg-emerald-50",
        };
      default:
        return {
          border: "border-l-blue-500",
          icon: "bg-blue-50",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {defaultStats.map((stat, idx) => {
        const colors = getColors(stat.color);
        return (
          <div
            key={idx}
            className={`bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 border-l-4 ${colors.border} hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-600 mt-1">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${colors.icon} flex-shrink-0`}>
                {stat.icon}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
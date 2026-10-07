"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Shield,
  BookOpen,
} from "lucide-react";

interface ActivityItem {
  title: string;
  description: string;
  type: "payment" | "risk" | "approval" | "document" | "service" | "assessment";
  timestamp: string;
}

interface LatestActivityProps {
  items: ActivityItem[];
}

export const LatestActivity: React.FC<LatestActivityProps> = ({ items }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "payment":
        return (
          <div className="p-2 bg-emerald-50 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        );
      case "risk":
        return (
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        );
      case "approval":
        return (
          <div className="p-2 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
        );
      case "document":
        return (
          <div className="p-2 bg-purple-50 rounded-lg">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
        );
      case "service":
        return (
          <div className="p-2 bg-orange-50 rounded-lg">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
        );
      case "assessment":
        return (
          <div className="p-2 bg-indigo-50 rounded-lg">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-slate-50 rounded-lg">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h3 className="text-sm font-bold text-slate-800">Latest activity</h3>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 transition-colors hover:bg-slate-50/50"
          >
            <div className="flex gap-3">
              {getActivityIcon(item.type)}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="shrink-0 text-[11px] font-medium text-slate-500">
                    {item.timestamp}
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

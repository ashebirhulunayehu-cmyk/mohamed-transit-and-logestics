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
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">Latest activity</h3>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex gap-3">
              {/* Icon */}
              {getActivityIcon(item.type)}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 font-medium flex-shrink-0">
                    {item.timestamp}
                  </p>
                </div>
                <p className="text-sm text-slate-600 mt-1">
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

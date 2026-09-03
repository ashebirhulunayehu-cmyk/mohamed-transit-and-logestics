"use client";

import React from "react";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface QueueItem {
  id: string;
  title: string;
  description: string;
  tags: Array<{
    label: string;
    color: "red" | "orange" | "green" | "blue" | "yellow";
  }>;
  updatedTime: string;
}

interface PriorityQueueProps {
  items: QueueItem[];
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({ items }) => {
  const getTagColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-50 text-red-700 border-red-200";
      case "orange":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "yellow":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "green":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "blue":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getIcon = (label: string) => {
    if (label.toLowerCase().includes("customer")) {
      return <AlertCircle className="w-4 h-4" />;
    }
    if (label.toLowerCase().includes("channel")) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    if (label.toLowerCase().includes("progress")) {
      return <Clock className="w-4 h-4" />;
    }
    if (label.toLowerCase().includes("review")) {
      return <CheckCircle2 className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">
          Priority queue
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Sorted by risk channel and time in stage
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  {item.id}
                </p>
                <p className="text-sm text-slate-700 mt-1 font-medium">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {item.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getTagColor(
                        tag.color
                      )}`}
                    >
                      {getIcon(tag.label)}
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-500 font-medium">
                  {item.updatedTime}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h3 className="text-sm font-bold text-slate-800">
          Priority queue
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Sorted by risk channel and time in stage
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="cursor-pointer p-3 transition-colors hover:bg-slate-50/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  {item.id}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.description}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {item.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getTagColor(
                        tag.color
                      )}`}
                    >
                      {getIcon(tag.label)}
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[11px] font-medium text-slate-500">
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

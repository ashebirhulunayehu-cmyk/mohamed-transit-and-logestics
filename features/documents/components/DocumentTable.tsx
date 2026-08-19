"use client";

import React from "react";
import { useDocumentStore } from "../document.store";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { FileText, Eye, MoreHorizontal } from "lucide-react";

export function DocumentTable() {
  const getFilteredDocuments = useDocumentStore((state) => state.getFilteredDocuments);
  const filteredData = getFilteredDocuments();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">DOCUMENT</th>
              <th className="py-3 px-4">TYPE</th>
              <th className="py-3 px-4">SERVICE / STAGE</th>
              <th className="py-3 px-4">UPLOADED BY</th>
              <th className="py-3 px-4">UPLOADED</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-800 hover:text-sky-700 cursor-pointer truncate max-w-[220px]">
                      {row.name}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-medium">{row.type}</td>
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-sky-700 block">{row.serviceId}</span>
                  <span className="text-[11px] text-slate-400 block">{row.serviceStage}</span>
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">{row.uploadedBy}</td>
                <td className="py-3.5 px-4 text-slate-500">{row.uploadedAt}</td>
                <td className="py-3.5 px-4">
                  <DocumentStatusBadge status={row.status} />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 text-slate-400">
                    <button className="p-1.5 hover:bg-slate-100 rounded-md hover:text-slate-700 transition-colors" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-slate-100 rounded-md hover:text-slate-700 transition-colors" title="More">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredData.length} documents</span>
        <span className="font-medium text-slate-700">Page 1 of 1</span>
      </div>
    </div>
  );
}
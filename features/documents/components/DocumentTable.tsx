"use client";

import React from "react";
import { useDocumentStore } from "../document.store";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { FileText, Download, CheckCheck, Trash2 } from "lucide-react";

export function DocumentTable() {
  const {
    getFilteredDocuments,
    verifyDocumentById,
    removeDocument,
    downloadFile,
    loading,
  } = useDocumentStore();
  const filteredData = getFilteredDocuments();

  const handleDownload = async (row: { id: string; name: string }) => {
    const file = await downloadFile(row.id);
    if (!(file instanceof Blob)) {
      throw new Error("The document endpoint did not return a file.");
    }

    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = row.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleVerify = async (row: { id: string }) => {
    await verifyDocumentById({ documentId: row.id, isVerified: true, notes: "Approved by review" });
  };

  const handleDelete = async (row: { id: string }) => {
    await removeDocument(row.id);
  };

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
            {loading && filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  Loading documents...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  No documents found.
                </td>
              </tr>
            ) : filteredData.map((row) => (
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
                    <button
                      type="button"
                      onClick={() => void handleDownload(row).catch(() => undefined)}
                      disabled={loading}
                      className="rounded-md p-1.5 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      title="Download document"
                      aria-label={`Download ${row.name}`}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleVerify(row).catch(() => undefined)}
                      disabled={loading}
                      className="p-1.5 hover:bg-emerald-50 rounded-md hover:text-emerald-700 transition-colors"
                      title="Verify"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row).catch(() => undefined)}
                      disabled={loading}
                      className="p-1.5 hover:bg-rose-50 rounded-md hover:text-rose-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
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
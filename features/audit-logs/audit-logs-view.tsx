'use client';

import React from 'react';
import { useAuditStore } from './audit-logs-store';
import { Search, Command, ShieldCheck, AlertCircle, Clock } from 'lucide-react';

const filterTabs = [
  { label: 'All', value: 'ALL' },
  { label: 'Issued', value: 'Issued assessment' },
  { label: 'Blocked', value: 'Blocked stage' },
  { label: 'Submitted', value: 'Submitted for approval' },
  { label: 'Revision', value: 'Requested revision' },
  { label: 'Returned', value: 'Returned KYC' },
];

export const AuditLogsView = () => {
  const { logs, searchQuery, selectedFilter, setSearchQuery, setSelectedFilter } = useAuditStore();

  // Filter & Search Logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = selectedFilter === 'ALL' || log.type === selectedFilter;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">AUDIT</span>
        <h2 className="text-2xl font-bold text-slate-900 mt-0.5">Assessment logs</h2>
        <p className="text-sm text-slate-500 mt-1">Every approval, rejection and revision you have recorded.</p>
      </div>

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Logs</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{logs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Issued Assessments</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-blue-600 mt-2">
            {logs.filter(l => l.type === 'Issued assessment').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Blocked / Revisions</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-2">
            {logs.filter(l => l.type === 'Blocked stage' || l.type === 'Requested revision').length}
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search reference, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedFilter(tab.value)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition ${
                selectedFilter === tab.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Logs List Container */}
      <div className="space-y-3">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-slate-900">
                  {log.type} — <span className="text-blue-600 font-semibold cursor-pointer hover:underline">{log.reference}</span>
                  {log.stage && <span className="text-slate-500 font-normal"> · {log.stage}</span>}
                </h3>
                <span className="text-xs text-slate-400 font-medium">{log.timestamp}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5">{log.description}</p>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-sm">
            ምንም የሚመሳሰል መረጃ አልተገኘም። (No matching logs found)
          </div>
        )}
      </div>
    </div>
  );
};
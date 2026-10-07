import React from 'react';
import { AuditLogsView } from '@/features/audit-logs/audit-logs-view';

export default function AssessmentLogsPage() {
  return (
    <main className="w-full max-w-6xl mx-auto min-h-screen bg-slate-50">
      <AuditLogsView />
    </main>
  );
}
import React from 'react';
import { AuditLogsView } from '@/features/audit-logs/audit-logs-view';

export default function AssessmentLogsPage() {
  return (
    <main className="p-8 max-w-6xl w-full mx-auto min-h-screen bg-slate-50">
      <AuditLogsView />
    </main>
  );
}
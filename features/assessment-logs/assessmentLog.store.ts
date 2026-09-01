import { create } from 'zustand';
import type { AssessmentLog, AssessmentLogFilterState } from './assessmentLog.types';

interface AssessmentLogStoreState extends AssessmentLogFilterState {
  logs: AssessmentLog[];
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: AssessmentLog['status'] | 'All') => void;
  getFilteredLogs: () => AssessmentLog[];
}

const initialLogs: AssessmentLog[] = [
  {
    id: '1',
    status: 'Issued assessment',
    details: 'Duty & tax notice ASN-2026-0417 · ETB 486,214.00',
    timestamp: '30 Jul 2026, 11:12',
    metadata: 'SVC-2026-0417',
  },
  {
    id: '2',
    status: 'Blocked stage',
    details: 'Reason: certificate of origin mismatch',
    timestamp: '30 Jul 2026, 10:40',
    metadata: 'Inspection',
  },
  {
    id: '3',
    status: 'Submitted for approval',
    details: 'KYC pack — 5 documents',
    timestamp: '30 Jul 2026, 09:55',
    metadata: 'CUS-10455',
  },
  {
    id: '4',
    status: 'Requested revision',
    details: 'Valuation query — unit price 12% below reference',
    timestamp: '29 Jul 2026, 19:00',
    metadata: 'SVC-2026-0431',
  },
  {
    id: '5',
    status: 'Returned KYC',
    details: 'Trade licence expired 2026-06-30',
    timestamp: '29 Jul 2026, 13:20',
    metadata: 'CUS-10502',
  },
];

export const useAssessmentLogStore = create<AssessmentLogStoreState>((set, get) => ({
  logs: initialLogs,
  status: 'All',
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (status) => set({ status }),
  getFilteredLogs: () => {
    const { logs, searchQuery, status } = get();

    return logs.filter((log) => {
      const haystack = `${log.status} ${log.details} ${log.metadata ?? ''}`.toLowerCase();
      const matchesSearch = searchQuery.trim() === '' || haystack.includes(searchQuery.toLowerCase());
      const matchesStatus = status === 'All' || log.status === status;

      return matchesSearch && matchesStatus;
    });
  },
}));

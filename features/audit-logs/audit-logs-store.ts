import { create } from 'zustand';

export type LogType = 
  | 'Issued assessment' 
  | 'Blocked stage' 
  | 'Submitted for approval' 
  | 'Requested revision' 
  | 'Returned KYC';

export interface AuditLog {
  id: string;
  type: LogType;
  reference: string;
  description: string;
  timestamp: string;
  stage?: string;
}

interface AuditState {
  logs: AuditLog[];
  searchQuery: string;
  selectedFilter: string;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: string) => void;
  addLog: (log: AuditLog) => void;
}

const INITIAL_LOGS: AuditLog[] = [
  {
    id: '1',
    type: 'Issued assessment',
    reference: 'SVC-2026-0417',
    description: 'Duty & tax notice ASN-2026-0417 · ETB 486,214.00',
    timestamp: '30 Jul 2026, 11:12',
  },
  {
    id: '2',
    type: 'Blocked stage',
    reference: 'SVC-2026-0392',
    stage: 'Inspection',
    description: 'Reason: certificate of origin mismatch',
    timestamp: '30 Jul 2026, 10:40',
  },
  {
    id: '3',
    type: 'Submitted for approval',
    reference: 'CUS-10455',
    description: 'KYC pack — 5 documents',
    timestamp: '30 Jul 2026, 09:55',
  },
  {
    id: '4',
    type: 'Requested revision',
    reference: 'SVC-2026-0431',
    description: 'Valuation query — unit price 12% below reference',
    timestamp: '29 Jul 2026, 19:00',
  },
  {
    id: '5',
    type: 'Returned KYC',
    reference: 'CUS-10502',
    description: 'Trade licence expired 2026-06-30',
    timestamp: '29 Jul 2026, 13:20',
  },
];

export const useAuditStore = create<AuditState>((set) => ({
  logs: INITIAL_LOGS,
  searchQuery: '',
  selectedFilter: 'ALL',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
}));
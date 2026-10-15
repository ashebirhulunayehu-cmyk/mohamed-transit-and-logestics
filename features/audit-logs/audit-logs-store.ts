import { create } from 'zustand';
import { AssessorEndpoints } from '@/modules/assessor/assessor.endpoint';

export type LogType = string;

export interface AuditLog {
  id: string;
  type: LogType;
  reference: string;
  description: string;
  timestamp: string;
  stage?: string;
  actor?: string;
  category?: string;
}

interface AuditState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedFilter: string;
  fetchLogs: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: string) => void;
  addLog: (log: AuditLog) => void;
}

type ApiRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as ApiRecord
    : null;

const readText = (record: ApiRecord, ...keys: string[]): string => {
  for (const key of keys) {
    const matchingKey = Object.keys(record).find(
      (recordKey) => recordKey.toLowerCase() === key.toLowerCase(),
    );
    const value = matchingKey ? record[matchingKey] : undefined;
    if (typeof value === 'string' || typeof value === 'number') {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return '';
};

const readActor = (record: ApiRecord): string => {
  const directActor = readText(record, 'actorName', 'userName', 'performedByName', 'createdByName', 'username');
  if (directActor) return directActor;

  const actor = asRecord(record.actor ?? record.user ?? record.performedBy ?? record.createdBy ?? record.assessor);
  if (!actor) return '';

  return readText(actor, 'fullName', 'name', 'displayName')
    || [readText(actor, 'firstName'), readText(actor, 'lastName')].filter(Boolean).join(' ')
    || readText(actor, 'username', 'email');
};

const unwrapLogList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;

  const record = asRecord(value);
  if (!record) return [];

  for (const key of ['data', 'response', 'payload', 'items', 'results', 'logs', 'assessmentLogs']) {
    if (record[key] !== undefined) {
      const list = unwrapLogList(record[key]);
      if (list.length || Array.isArray(record[key])) return list;
    }
  }

  return [];
};

const normalizeLog = (value: unknown, index: number): AuditLog | null => {
  const record = asRecord(value);
  if (!record) return null;

  const type = readText(record, 'type', 'action', 'actionType', 'actionName', 'status', 'activityType', 'eventType');
  const description = readText(record, 'description', 'details', 'message', 'notes', 'reason');
  const timestamp = readText(record, 'timestamp', 'createdAt', 'createdDate', 'createdOn', 'actionDate', 'eventDate', 'date');
  const reference = readText(record, 'reference', 'serviceId', 'serviceReference', 'trackingNumber', 'trackingId', 'customerId', 'referenceId');
  const id = readText(record, 'id', 'logId', 'assessmentLogId') || `${timestamp}-${index}`;
  const actor = readActor(record);
  const category = readText(record, 'category', 'entityType', 'module', 'resourceType');

  if (!type && !description) return null;

  return {
    id,
    type: type || 'Assessment activity',
    reference: reference || '—',
    description: description || type,
    timestamp: timestamp || '—',
    stage: readText(record, 'stage', 'stageName', 'serviceStage'),
    actor: actor || undefined,
    category: category || undefined,
  };
};

const getErrorMessage = (error: unknown): string =>
  typeof error === 'string' ? error : error instanceof Error ? error.message : 'Failed to load assessment logs.';

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedFilter: 'ALL',
  fetchLogs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AssessorEndpoints.getAssessmentLogs();
      const logs = unwrapLogList(response)
        .map(normalizeLog)
        .filter((log): log is AuditLog => log !== null);
      set({ logs, loading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
}));
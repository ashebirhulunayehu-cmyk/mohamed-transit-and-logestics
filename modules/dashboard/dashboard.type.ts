export type DashboardValue = Record<string, unknown>;

export interface DashboardApiEnvelope<T> {
  data?: T;
  payload?: T;
  response?: { data?: T } | T;
  statusCode?: number;
  message?: string;
  error?: boolean;
  isError?: boolean;
}

export type DashboardList = DashboardValue[];

import { create } from 'zustand';
import { AssessorEndpoints } from './assessor.endpoint.ts';

interface AssessorState {
  pendingCustomers: any[];
  pendingServices: any[];
  servicesUnderOversight: any[];
  complianceIssues: any[];
  dashboardData: any | null;
  loading: boolean;
  error: string | null;

  fetchPendingCustomers: () => Promise<void>;
  approveCustomer: (payload: { customerId: string; isApproved: boolean; remark?: string }) => Promise<void>;
  fetchDashboard: () => Promise<void>;
}

export const useAssessorStore = create<AssessorState>((set, get) => ({
  pendingCustomers: [],
  pendingServices: [],
  servicesUnderOversight: [],
  complianceIssues: [],
  dashboardData: null,
  loading: false,
  error: null,

  // 1. Fetch Pending Customers
  fetchPendingCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AssessorEndpoints.getPendingCustomerApprovals();
      set({ pendingCustomers: response.data?.data || response.data || [], loading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch pending customers', loading: false });
    }
  },

  // 2. Approve/Reject Customer
  approveCustomer: async (payload) => {
    set({ loading: true, error: null });
    try {
      await AssessorEndpoints.approveCustomer(payload);
      await get().fetchPendingCustomers(); // Refresh list after approval
    } catch (err: any) {
      set({ error: err?.message || 'Action failed', loading: false });
      throw err;
    }
  },

  // 7. Fetch Dashboard
  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await AssessorEndpoints.getDashboard();
      set({ dashboardData: response.data?.data || response.data, loading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to load dashboard', loading: false });
    }
  },
}));
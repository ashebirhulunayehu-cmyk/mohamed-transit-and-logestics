import { create } from "zustand";

export type ManagerRole = "manager" | "administrator" | "supervisor";

export interface CaseMetrics {
  id: string;
  caseNumber: string;
  importerName: string;
  status: string;
  priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  submittedDate: string;
  assignedTo: string;
  dueDate: string;
}

export interface ManagerFilters {
  search: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string;
}

export interface ManagerStats {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  pendingApproval: number;
  overdueCases: number;
  averageResolutionTime: string;
}

export interface ManagerState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  selectedRole: ManagerRole;
  selectedCase: CaseMetrics | null;
  filters: ManagerFilters;
  isLoading: boolean;
  isConfirmationOpen: boolean;
  confirmationAction: "approve" | "reject" | "reassign" | null;
  stats: ManagerStats;

  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setSelectedRole: (role: ManagerRole) => void;
  setSelectedCase: (caseData: CaseMetrics | null) => void;
  setFilters: (filters: Partial<ManagerFilters>) => void;
  setLoading: (loading: boolean) => void;
  openConfirmation: (action: "approve" | "reject" | "reassign") => void;
  closeConfirmation: () => void;
  resetFilters: () => void;
  setStats: (stats: ManagerStats) => void;
}

const initialFilters: ManagerFilters = {
  search: "",
  status: undefined,
  priority: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  assignedTo: undefined,
};

const initialStats: ManagerStats = {
  totalCases: 0,
  activeCases: 0,
  completedCases: 0,
  pendingApproval: 0,
  overdueCases: 0,
  averageResolutionTime: "0h",
};

export const useManagerStore = create<ManagerState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  selectedRole: "manager",
  selectedCase: null,
  filters: initialFilters,
  isLoading: false,
  isConfirmationOpen: false,
  confirmationAction: null,
  stats: initialStats,

  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),
  toggleMobileSidebar: () =>
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),

  setSelectedRole: (role: ManagerRole) =>
    set({
      selectedRole: role,
    }),

  setSelectedCase: (caseData: CaseMetrics | null) =>
    set({
      selectedCase: caseData,
    }),

  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),

  setLoading: (loading: boolean) =>
    set({
      isLoading: loading,
    }),

  openConfirmation: (action) =>
    set({
      isConfirmationOpen: true,
      confirmationAction: action,
    }),

  closeConfirmation: () =>
    set({
      isConfirmationOpen: false,
      confirmationAction: null,
    }),

  resetFilters: () =>
    set({
      filters: initialFilters,
    }),

  setStats: (stats: ManagerStats) =>
    set({
      stats,
    }),
}));

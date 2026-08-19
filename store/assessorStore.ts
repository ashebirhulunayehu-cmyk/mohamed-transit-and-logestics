import { create } from "zustand";

export type AssessorRole = "assessor" | "senior_assessor" | "supervisor";

export interface Case {
  id: string;
  caseNumber: string;
  importerName: string;
  status: string;
  priority: "CRITICAL" | "HIGH" | "NORMAL";
  submittedDate: string;
}

export interface AssessorFilters {
  search: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AssessorState {
  sidebarCollapsed: boolean;
  selectedRole: AssessorRole;
  selectedCase: Case | null;
  filters: AssessorFilters;
  isLoading: boolean;
  isConfirmationOpen: boolean;
  confirmationAction: "approve" | "reject" | "correction" | null;

  toggleSidebar: () => void;
  setSelectedRole: (role: AssessorRole) => void;
  setSelectedCase: (caseData: Case | null) => void;
  setFilters: (filters: Partial<AssessorFilters>) => void;
  setLoading: (loading: boolean) => void;
  openConfirmation: (action: "approve" | "reject" | "correction") => void;
  closeConfirmation: () => void;
  resetFilters: () => void;
}

const initialFilters: AssessorFilters = {
  search: "",
  status: undefined,
  priority: undefined,
  dateFrom: undefined,
  dateTo: undefined,
};

export const useAssessorStore = create<AssessorState>((set) => ({
  sidebarCollapsed: false,
  selectedRole: "assessor",
  selectedCase: null,
  filters: initialFilters,
  isLoading: false,
  isConfirmationOpen: false,
  confirmationAction: null,

  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),

  setSelectedRole: (role: AssessorRole) =>
    set({
      selectedRole: role,
    }),

  setSelectedCase: (caseData: Case | null) =>
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
}));
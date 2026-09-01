import { create } from "zustand";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface CustomerApproval {
  id: string;
  customerName: string;
  caseNumber: string;
  applicationType: string;
  submittedDate: string;
  status: ApprovalStatus;
  email: string;
  phone: string;
  documents: string[];
}

interface CustomerApprovalState {
  approvals: CustomerApproval[];

  selectedCustomer: CustomerApproval | null;

  filter: "all" | ApprovalStatus;

  search: string;

  setFilter: (
    filter: "all" | ApprovalStatus
  ) => void;

  setSearch: (search: string) => void;

  setSelectedCustomer: (
    customer: CustomerApproval | null
  ) => void;

  approveCustomer: (id: string) => void;

  rejectCustomer: (id: string) => void;
}

const initialApprovals: CustomerApproval[] = [
  {
    id: "1",
    customerName: "ABC Import & Export PLC",
    caseNumber: "MTG-2026-00128",
    applicationType: "Commercial Import",
    submittedDate: "2026-08-15",
    status: "pending",
    email: "contact@abc-import.com",
    phone: "+251 911 234 567",
    documents: [
      "Business License",
      "TIN Certificate",
      "Import Documents",
    ],
  },

  {
    id: "2",
    customerName: "Ethiopian Trading House",
    caseNumber: "MTG-2026-00124",
    applicationType: "Vehicle Import",
    submittedDate: "2026-08-14",
    status: "pending",
    email: "info@ethtrading.com",
    phone: "+251 922 345 678",
    documents: [
      "Business License",
      "TIN Certificate",
    ],
  },

  {
    id: "3",
    customerName: "Blue Nile General Trading",
    caseNumber: "MTG-2026-00119",
    applicationType: "General Cargo",
    submittedDate: "2026-08-12",
    status: "approved",
    email: "info@bluenile.com",
    phone: "+251 933 456 789",
    documents: [
      "Business License",
      "Import Documents",
    ],
  },

  {
    id: "4",
    customerName: "East Africa Logistics PLC",
    caseNumber: "MTG-2026-00115",
    applicationType: "Cargo Import",
    submittedDate: "2026-08-10",
    status: "rejected",
    email: "contact@ealogistics.com",
    phone: "+251 944 567 890",
    documents: [
      "Business License",
      "TIN Certificate",
    ],
  },
];

export const useCustomerApprovalStore =
  create<CustomerApprovalState>((set) => ({
    approvals: initialApprovals,

    selectedCustomer: null,

    filter: "all",

    search: "",

    setFilter: (filter) =>
      set({
        filter,
      }),

    setSearch: (search) =>
      set({
        search,
      }),

    setSelectedCustomer: (customer) =>
      set({
        selectedCustomer: customer,
      }),

    approveCustomer: (id) =>
      set((state) => ({
        approvals: state.approvals.map(
          (customer) =>
            customer.id === id
              ? {
                  ...customer,
                  status: "approved",
                }
              : customer
        ),
      })),

    rejectCustomer: (id) =>
      set((state) => ({
        approvals: state.approvals.map(
          (customer) =>
            customer.id === id
              ? {
                  ...customer,
                  status: "rejected",
                }
              : customer
        ),
      })),
  }));
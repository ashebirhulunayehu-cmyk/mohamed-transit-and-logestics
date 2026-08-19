import { create } from "zustand";

export interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
}

export interface ProfileState {
  fullName: string;
  role: string;
  branch: string;
  userId: string;
  twoFactorEnabled: boolean;
  sessionTimeout: string;
  activities: ActivityItem[];
  
  // Actions
  toggleTwoFactor: () => void;
  revokeOtherSessions: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  fullName: "Hanna Wolde",
  role: "Valuation & Compliance Assessor",
  branch: "HQ — Addis Ababa",
  userId: "u-005",
  twoFactorEnabled: true,
  sessionTimeout: "15 minutes idle",
  activities: [
    {
      id: "1",
      action: "Signed in",
      detail: "OTP verified · 196.188.44.12 · Addis Ababa",
      timestamp: "29 Jul 2026, 10:12",
    },
    {
      id: "2",
      action: "Issued assessment",
      detail: "Duty & tax notice ASN-2026-0417 · ETB 486,214.00",
      timestamp: "30 Jul 2026, 11:12",
    },
    {
      id: "3",
      action: "Blocked stage",
      detail: "Reason: certificate of origin mismatch",
      timestamp: "30 Jul 2026, 10:40",
    },
    {
      id: "4",
      action: "Uploaded document",
      detail: "Temperature-Log-ULD-1-6.csv (64 KB)",
      timestamp: "30 Jul 2026, 10:01",
    },
  ],

  toggleTwoFactor: () =>
    set((state) => ({ twoFactorEnabled: !state.twoFactorEnabled })),

  revokeOtherSessions: () => {
    alert("Other active sessions have been successfully revoked.");
  },
}));
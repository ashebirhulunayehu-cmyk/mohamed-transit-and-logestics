import { create } from "zustand";
import useAuthStore from "@/modules/auth/auth.store";

export interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
}

type ProfileAuthUser = {
  roleName?: string;
  roles?: Array<string | { roleName?: string; name?: string; role?: { name?: string } | null }>;
  username?: string;
  firstName?: string;
  lastName?: string;
  id?: string | number;
};

const resolveRoleName = () => {
  const authUser = useAuthStore.getState().user as ProfileAuthUser | null;

  if (authUser?.roleName) return authUser.roleName;

  const roles = authUser?.roles ?? [];
  for (const role of roles) {
    if (typeof role === "string" && role.trim()) return role.trim();
    if (role && typeof role === "object") {
      const record = role as Record<string, unknown>;
      const direct = record.roleName ?? record.name;
      if (typeof direct === "string" && direct.trim()) return direct.trim();

      const nestedRole = record.role;
      if (nestedRole && typeof nestedRole === "object") {
        const nestedName = (nestedRole as Record<string, unknown>).name;
        if (typeof nestedName === "string" && nestedName.trim()) return nestedName.trim();
      }
    }
  }

  return "Assessment User";
};

export interface ProfileState {
  fullName: string;
  role: string;
  branch: string;
  userId: string;
  twoFactorEnabled: boolean;
  sessionTimeout: string;
  activities: ActivityItem[];

  syncFromAuthUser: () => void;
  toggleTwoFactor: () => void;
  revokeOtherSessions: () => void;
}

export const useProfileStore = create<ProfileState>((set) => {
  const authUser = useAuthStore.getState().user;
  const firstName = authUser?.firstName ?? "";
  const lastName = authUser?.lastName ?? "";

  return {
    fullName: [firstName, lastName].filter(Boolean).join(" ") || authUser?.username || "User",
    role: resolveRoleName(),
    branch: "HQ — Addis Ababa",
    userId: authUser?.id ? String(authUser.id) : "u-unknown",
    twoFactorEnabled: true,
    sessionTimeout: "15 minutes idle",
    activities: [
      {
        id: "1",
        action: "Signed in",
        detail: "OTP verified · current session",
        timestamp: "Today",
      },
      {
        id: "2",
        action: "Profile opened",
        detail: "Account details reviewed",
        timestamp: "Today",
      },
    ],

    syncFromAuthUser: () => {
      const authUserNext = useAuthStore.getState().user;
      const nextFullName = [authUserNext?.firstName ?? "", authUserNext?.lastName ?? ""].filter(Boolean).join(" ") || authUserNext?.username || "User";

      set({
        fullName: nextFullName,
        role: resolveRoleName(),
        userId: authUserNext?.id ? String(authUserNext.id) : "u-unknown",
      });
    },

    toggleTwoFactor: () =>
      set((state) => ({ twoFactorEnabled: !state.twoFactorEnabled })),

    revokeOtherSessions: () => {
      alert("Other active sessions have been successfully revoked.");
    },
  };
});
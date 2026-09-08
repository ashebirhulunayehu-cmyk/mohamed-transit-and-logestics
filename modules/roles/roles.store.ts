"use client";

import { create } from "zustand";
import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  updateRole,
} from "./roles.endpoint";
import type { RoleDto, RoleListParams } from "./roles.types";

interface RolesState {
  roles: RoleDto[];
  selectedRole: RoleDto | null;
  loading: boolean;
  error: string | null;
  fetchRoles: (params?: RoleListParams) => Promise<void>;
  fetchRoleById: (id: string | number) => Promise<RoleDto | null>;
  addRole: (payload: RoleDto) => Promise<void>;
  editRole: (payload: RoleDto) => Promise<void>;
  removeRole: (id: string | number) => Promise<void>;
  clearError: () => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toRole = (value: unknown): RoleDto | null => {
  if (!isRecord(value) || typeof value.roleName !== "string") {
    return null;
  }

  return {
    ...value,
    id: typeof value.id === "number" ? value.id : undefined,
    roleName: value.roleName,
    privileges: Array.isArray(value.privileges) ? value.privileges : [],
  } as RoleDto;
};

const extractRoles = (value: unknown): RoleDto[] => {
  if (Array.isArray(value)) {
    return value.map(toRole).filter((role): role is RoleDto => role !== null);
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of ["data", "payload", "items", "roles", "result"]) {
    const nested = value[key];
    const nestedRoles = Array.isArray(nested) ? extractRoles(nested) : [];
    if (nestedRoles.length > 0) {
      return nestedRoles;
    }

    const nestedRole = Array.isArray(nested) ? null : toRole(nested);
    if (nestedRole) {
      return [nestedRole];
    }
  }

  const role = toRole(value);
  return role ? [role] : [];
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : typeof error === "string" ? error : fallback;

export const useRolesStore = create<RolesState>((set) => ({
  roles: [],
  selectedRole: null,
  loading: false,
  error: null,

  fetchRoles: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await getAllRoles(params);
      set({ roles: extractRoles(response), loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error, "Failed to load roles.") });
      throw error;
    }
  },

  fetchRoleById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await getRoleById(id);
      const role = extractRoles(response)[0] || null;
      set({ selectedRole: role, loading: false });
      return role;
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error, "Failed to load role.") });
      throw error;
    }
  },

  addRole: async (payload) => {
    set({ loading: true, error: null });
    try {
      await createRole(payload);
      set({ loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error, "Failed to create role.") });
      throw error;
    }
  },

  editRole: async (payload) => {
    set({ loading: true, error: null });
    try {
      await updateRole(payload);
      set({ loading: false });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error, "Failed to update role.") });
      throw error;
    }
  },

  removeRole: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteRole(id);
      set((state) => ({
        roles: state.roles.filter((role) => role.id !== Number(id)),
        selectedRole: state.selectedRole?.id === Number(id) ? null : state.selectedRole,
        loading: false,
      }));
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error, "Failed to delete role.") });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useRolesStore;

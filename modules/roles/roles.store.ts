"use client";

import { create } from "zustand";
import {
  createRole,
  createRolePrivileges,
  deleteRole,
  getAllRolePrivileges,
  getAllRoles,
  getRoleById,
  updateRole,
} from "./roles.endpoint";
import type {
  CreateRolePrivilegeRequest,
  RoleDto,
  RoleListParams,
  RolePrivilegeDto,
} from "./roles.types";

interface RolesState {
  roles: RoleDto[];
  rolePrivileges: RolePrivilegeDto[];
  selectedRole: RoleDto | null;
  loading: boolean;
  error: string | null;
  fetchRoles: (params?: RoleListParams) => Promise<void>;
  fetchRoleById: (id: string | number) => Promise<RoleDto | null>;
  fetchRolePrivileges: () => Promise<RolePrivilegeDto[]>;
  assignRolePrivileges: (payload: CreateRolePrivilegeRequest) => Promise<unknown>;
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

const normalizeRolePrivilege = (value: unknown): RolePrivilegeDto | null => {
  if (!isRecord(value)) return null;

  const privilege = isRecord(value.privilege) ? value.privilege : null;
  const role = isRecord(value.role) ? value.role : null;

  return {
    id: typeof value.id === "number" ? value.id : Number(value.privilegeId ?? 0),
    roleId: typeof value.roleId === "number" ? value.roleId : Number(role?.id ?? 0),
    privilegeId: typeof value.privilegeId === "number" ? value.privilegeId : Number(value.id ?? 0),
    privilege: privilege
      ? {
          id: typeof privilege.id === "number" ? privilege.id : undefined,
          privilegeName: typeof privilege.privilegeName === "string" ? privilege.privilegeName : typeof privilege.name === "string" ? privilege.name : undefined,
          name: typeof privilege.name === "string" ? privilege.name : typeof privilege.privilegeName === "string" ? privilege.privilegeName : undefined,
        }
      : null,
    role: isRecord(value.role) ? ({
      id: typeof value.role.id === "number" ? value.role.id : undefined,
      roleName: typeof value.role.roleName === "string" ? value.role.roleName : "",
      privileges: Array.isArray(value.role.privileges) ? value.role.privileges as RoleDto["privileges"] : [],
    } as RoleDto) : null,
    recordStatus: typeof value.recordStatus === "number" ? value.recordStatus : 1,
  };
};

const extractRolePrivileges = (value: unknown): RolePrivilegeDto[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeRolePrivilege).filter((item): item is RolePrivilegeDto => item !== null);
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of ["data", "payload", "items", "result", "rolePrivileges"]) {
    const nested = value[key];
    const privileges = extractRolePrivileges(nested);
    if (privileges.length) {
      return privileges;
    }
  }

  const privilege = normalizeRolePrivilege(value);
  return privilege ? [privilege] : [];
};

export const useRolesStore = create<RolesState>((set) => ({
  roles: [],
  rolePrivileges: [],
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

  fetchRolePrivileges: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getAllRolePrivileges();
      const rolePrivileges = extractRolePrivileges(response);
      set({ rolePrivileges, loading: false, error: null });
      return rolePrivileges;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to load role privileges.");
      set({ rolePrivileges: [], loading: false, error: message });
      throw error;
    }
  },

  assignRolePrivileges: async (payload) => {
    set({ loading: true, error: null });
    try {
      const result = await createRolePrivileges(payload);
      const nextPrivileges = extractRolePrivileges(await getAllRolePrivileges());
      set({ rolePrivileges: nextPrivileges, loading: false, error: null });
      return result;
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to assign role privileges.");
      set({ loading: false, error: message });
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

import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";
import type {
  RoleDto,
  RoleListParams,
  RolePrivilegeDto,
  CreateRolePrivilegeRequest,
  RoleResponse,
} from "./roles.types";

export const rolesEndpoints = Object.freeze(API_ROUTES.roles);

export const createRole = (payload: RoleDto): Promise<RoleResponse> =>
  service.post(rolesEndpoints.create, payload);

export const updateRole = (payload: RoleDto): Promise<RoleResponse> =>
  service.put(rolesEndpoints.update, payload);

export const deleteRole = (id: string | number): Promise<unknown> =>
  service.delete(rolesEndpoints.remove(id));

export const getAllRoles = (params?: RoleListParams): Promise<RoleResponse> =>
  service.get(rolesEndpoints.getAll, { params });

export const getRoleById = (id: string | number): Promise<RoleResponse> =>
  service.get(rolesEndpoints.getById(id));

export const getAllRolePrivileges = (): Promise<RolePrivilegeDto[]> =>
  service.get(API_ROUTES.rolePrivilege.getAll);

export const createRolePrivileges = (
  payload: CreateRolePrivilegeRequest
): Promise<unknown> => service.post(API_ROUTES.rolePrivilege.create, payload);

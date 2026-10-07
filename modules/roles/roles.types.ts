export interface PrivilegeDto {
  id?: number;
  privilegeName?: string;
  name?: string;
  [key: string]: unknown;
}

export interface RoleDto {
  id?: number;
  roleName: string;
  privileges?: PrivilegeDto[];
}

export interface RolePrivilegeDto {
  id: number;
  roleId: number;
  privilegeId: number;
  privilege: PrivilegeDto | null;
  role: RoleDto | null;
  recordStatus: number;
}

export interface CreateRolePrivilegeRequest {
  roleId: number;
  privileges: number[];
  [key: string]: unknown;
}

export interface RoleListParams {
  recordStatus?: string;
}

export type RoleResponse = RoleDto | RoleDto[] | Record<string, unknown>;

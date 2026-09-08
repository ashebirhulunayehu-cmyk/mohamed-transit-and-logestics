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

export interface RoleListParams {
  recordStatus?: string;
}

export type RoleResponse = RoleDto | RoleDto[] | Record<string, unknown>;

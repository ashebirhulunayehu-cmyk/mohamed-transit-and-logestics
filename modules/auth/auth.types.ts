export interface IUserRole {
  id?: number;
  userId?: number;
  roleId?: number;
  role?: IRole | null;
}

export interface IRole {
  id?: number;
  name?: string;
  description?: string;
  recordStatus?: number;
  rolePrivileges?: unknown[];
  userRoles?: IUserRole[];
}

export interface IPrivilege {
  id?: number;
  action?: string;
  description?: string;
}

export interface IUserRoleAssignment {
  id?: number;
  roleName?: string;
  privileges?: IPrivilege[];
}

export interface IUser {
  id?: string | number;
  userId?: string | number;
  UserId?: string | number;
  sub?: string | number;
  username?: string;
  roleName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  profilePictureUrl?: string;
  password?: string;
  refreshToken?: string;
  refreshTokenExpireDate?: string;
  recordStatus?: number;
  accountStatus?: number;
  organizationId?: string | number;
  isAccountLocked?: boolean;
  verificationToken?: string;
  loginAttemptCount?: number;
  lastLoginDateTime?: string;
  isConfirmationEmailSent?: boolean;
  userTokenLifetime?: number;
  roles?: Array<IUserRoleAssignment | { roleName?: string } | string>;
  userRoles?: IUserRole[];
  isSuperAdmin?: boolean;
}

export interface ILogin {
  username?: string;
  email?: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin?: boolean;
  password: string;
  phone?: string;
  profileFile?: File;
  profilePhoto?: string;
  roles?: number[];
  username: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string | number;
  organizationId?: string | number;
  recordStatus?: string;
}

export interface LoginUserRequest {
  email?: string;
  userName?: string;
  password: string;
}

export interface LoginPrivilege extends IPrivilege {
  id: number;
  action: string;
  description: string;
}

export interface LoginRole extends IUserRoleAssignment {
  id: number;
  roleName: string;
  privileges: LoginPrivilege[];
}

export interface LoginResponse extends IUser, Record<string, unknown> {
  id: number;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  roles: LoginRole[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
  command?: "RefreshToken";
}

export interface UserListParams {
  recordStatus?: string | number;
}

export type UserResponse = IUser | IUser[] | Record<string, unknown>;

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface EmailResetPasswordRequest {
  token: string;
  email: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export type AuthState = { loading: boolean; user: IUser | null; error: string | null };

export type AuthStore = AuthState & {
  login: (payload: ILogin) => Promise<IUser>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateUserRequest) => Promise<IUser>;
  syncProfile: (payload: Partial<IUser>, options?: { persist?: boolean }) => void;
  signUp: (payload: FormData | IUser) => Promise<void>;
  forgotPassword: (payload: ForgotPasswordRequest) => Promise<void>;
  updatePassword: (payload: ChangePasswordRequest) => Promise<void>;
  resetPassword: (payload: ResetPasswordRequest) => Promise<void>;
  resetPasswordFromEmail: (payload: EmailResetPasswordRequest) => Promise<void>;
};

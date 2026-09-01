export interface IUser {
  id?: string | number;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneNumber?: string;
  profilePhoto?: string;
  organization?: string;
  organizationId?: string | number;
  recordStatus?: string;
  roles?: Array<{ roleName?: string } | string>;
  userRoles?: unknown[];
  isSuperAdmin?: boolean;
}

export interface ILogin {
  username?: string;
  email?: string;
  password: string;
}

export interface IPasswordPayload {
  username?: string;
  email?: string;
  password?: string;
  newPassword: string;
  confirmPassword?: string;
}

export type AuthState = {
  loading: boolean;
  user: IUser | null;
  error: string | null;
};

export type AuthActions = {
  logout: () => Promise<void>;
  login: (payload: ILogin) => Promise<void>;
  signUp: (payload: IUser) => Promise<void>;
  forgotPassword: (payload: IPasswordPayload) => Promise<void>;
  updatePassword: (payload: IPasswordPayload) => Promise<void>;
  resetPassword: (payload: IPasswordPayload) => Promise<void>;
};

export type AuthStore = AuthState & AuthActions;

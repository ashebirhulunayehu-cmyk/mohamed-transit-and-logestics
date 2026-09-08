import axiosInstance from "@/modules/utils/axios";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'assessor' | 'importer' | 'admin';
}

interface AuthApiResponse {
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  accessToken?: string;
  token?: string;
  user?: AuthUser | Record<string, unknown>;
}

export class AuthService {
  static async login(credentials: LoginCredentials) {
    const response = (await axiosInstance.post('/User/Login', credentials)) as AuthApiResponse;

    const payload = (response?.data?.payload ?? response?.payload ?? response?.data ?? {}) as Record<string, unknown>;

    const token =
      typeof payload.accessToken === 'string'
        ? payload.accessToken
        : typeof response?.data?.accessToken === 'string'
          ? response.data.accessToken
          : typeof response?.accessToken === 'string'
            ? response.accessToken
            : typeof response?.data?.token === 'string'
              ? response.data.token
              : typeof response?.token === 'string'
                ? response.token
                : undefined;

    const user =
      (payload.user as AuthUser | Record<string, unknown> | undefined) ??
      (response?.data?.user as AuthUser | Record<string, unknown> | undefined) ??
      (response?.user as AuthUser | Record<string, unknown> | undefined) ??
      {
        id: typeof payload.id === 'string' || typeof payload.id === 'number' ? String(payload.id) : 'user-1',
        name: typeof payload.firstName === 'string' ? payload.firstName : credentials.username,
        email: typeof payload.email === 'string' ? payload.email : credentials.username,
        role: 'assessor' as const,
      };

    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      }

      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
    }

    return response?.data ?? response;
  }

  static async logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('auth_user');
    }

    return true;
  }
}

export const login = AuthService.login;

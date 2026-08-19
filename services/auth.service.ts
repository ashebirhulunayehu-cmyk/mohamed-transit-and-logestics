// services/auth.service.ts
import { APIClient } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'assessor' | 'importer' | 'admin';
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'assessor' | 'importer' | 'admin';
}

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    return APIClient.post<LoginResponse>('/api/auth/login', credentials);
  }

  static async logout(): Promise<void> {
    // Call backend logout if needed
    try {
      await APIClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

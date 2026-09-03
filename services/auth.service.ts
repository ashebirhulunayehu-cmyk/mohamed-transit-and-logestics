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

export class AuthService {
	static async login(credentials: LoginCredentials) {
		const response: any = await axiosInstance.post('/v1/User/Login', credentials);

		const payload = response?.data?.payload ?? response?.payload ?? response?.data ?? {};

		const token =
			payload?.accessToken ??
			response?.data?.accessToken ??
			response?.accessToken ??
			response?.data?.token ??
			response?.token;

		const user =
			payload?.user ??
			response?.data?.user ??
			response?.user ??
			{
				id: payload?.id ?? response?.data?.id ?? 'user-1',
				name: payload?.firstName || credentials.username,
				email: payload?.email || credentials.username,
				role: 'assessor',
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

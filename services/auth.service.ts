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
		const response = await axiosInstance.post('/v1/User/Login', credentials);

		const token =
			response?.data?.payload?.accessToken ??
			response?.data?.accessToken ??
			response?.data?.token;

		const user =
			response?.data?.payload?.user ??
			response?.data?.user ??
			{
				id: response?.data?.payload?.id ?? 'user-1',
				name: response?.data?.payload?.firstName || credentials.username,
				email: response?.data?.payload?.email || credentials.username,
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

		return response.data;
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

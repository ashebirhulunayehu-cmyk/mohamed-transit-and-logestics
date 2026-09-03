import axiosInstance from "@/modules/utils/axios";

// 1. Backend የሚቀበለው key name 'userName' (በካፒታል N) ነው
export interface LoginRequest {
  userName: string;
  password: string;
}

export interface Privilege {
  id: string | number;
  action: string;
}

export interface UserRole {
  id?: string | number;
  roleName?: string;
  name?: string;
  privileges?: Privilege[];
  role?: {
    id?: string | number;
    name?: string;
  };
}

export interface LoginUser {
  id: string | number;
  username?: string;
  userName?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePhoto?: string;
  userRoles?: UserRole[];
  roles?: UserRole[];
  refreshToken?: string;
  token?: string;
}

// 2. Response Interface (የነበረውን ዑደታዊ Self-referencing ስህተት ያስወገደ)
export interface LoginResponse {
  statusCode?: number;
  isSuccess?: boolean;
  error?: boolean;
  message?: string;
  response?: {
    data?: LoginUser[] | LoginUser;
    token?: string;
    refreshToken?: string;
    accessToken?: string;
  };
  data?: LoginUser[] | LoginUser;
  token?: string;
}

// 3. Login API Call Function
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>(
    "/v1/User/Login",
    data
  );

  return response.data as LoginResponse;
};
// import axiosInstance from '@/utils/axios';

import axiosInstance from "@/modules/utils/axios";


export interface LoginRequest {
  username: string;
  password: string;
}

export interface Privilege {
  id: string | number;
  action: string;
}

export interface UserRole {
  id: string | number;
  roleName: string;
  privileges: Privilege[];
}

export interface LoginUser {
  id: string | number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePhoto?: string;
  roles: UserRole[];
}

export interface LoginPayload {
  id: string | number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePhoto?: string;

  accessToken: string;
  refreshToken: string;

  roles: UserRole[];
}

export interface LoginResponse {
  data: LoginResponse | PromiseLike<LoginResponse>;
  payload: LoginPayload;
}

export const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response =
    axiosInstance.post<LoginResponse>(
      '/v1/User/Login',
      data
    );

  return response.data;
};
import { apiClient } from "./client";
import { AuthResponseData, ApiResponse } from "../types/api";

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
}

export async function loginApi(params: LoginParams): Promise<AuthResponseData> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>(
    "/api/auth/login",
    params
  );
  return response.data.data;
}

export async function registerApi(params: RegisterParams): Promise<AuthResponseData> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>(
    "/api/auth/register",
    params
  );
  return response.data.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/api/auth/logout");
}

export const authApi = {
  login: loginApi,
  register: registerApi,
  logout: logoutApi,
};

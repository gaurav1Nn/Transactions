import { apiClient } from "./client.js";
import { AuthResponseData, ApiResponse } from "../types/api.js";

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

export const authApi = {
  login: loginApi,
  register: registerApi,
};

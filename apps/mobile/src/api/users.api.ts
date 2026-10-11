import { apiClient } from "./client";
import { UserDto, ApiResponse } from "../types/api";

export async function getCurrentUser(): Promise<UserDto> {
  const response = await apiClient.get<ApiResponse<UserDto>>("/api/users/me");
  return response.data.data;
}

export const usersApi = {
  getCurrentUser,
};

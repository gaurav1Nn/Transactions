import * as SecureStore from "expo-secure-store";
import { UserDto } from "../types/api";

const TOKEN_KEY = "ace_access_token";
const USER_KEY = "ace_user_profile";

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUser(user: UserDto): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<UserDto | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "id" in parsed && "email" in parsed) {
      return parsed as UserDto;
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function clearSession(): Promise<void> {
  await Promise.all([deleteToken(), deleteUser()]);
}

export const tokenStorage = {
  saveToken,
  getToken,
  deleteToken,
  saveUser,
  getUser,
  deleteUser,
  clearSession,
};

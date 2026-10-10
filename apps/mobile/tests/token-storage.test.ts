import { describe, it, expect, beforeEach } from "vitest";
import {
  saveToken,
  getToken,
  deleteToken,
  saveUser,
  getUser,
  deleteUser,
  clearSession,
} from "../src/storage/token-storage.js";
import { resetMockSecureStore, setItemAsync } from "./mocks/secure-store.js";
import { UserDto } from "../src/types/api.js";

describe("SecureStore token-storage adapter", () => {
  beforeEach(() => {
    resetMockSecureStore();
  });

  it("saves and retrieves access token", async () => {
    expect(await getToken()).toBeNull();
    await saveToken("jwt-token-alpha");
    expect(await getToken()).toBe("jwt-token-alpha");
  });

  it("deletes access token", async () => {
    await saveToken("jwt-token-beta");
    await deleteToken();
    expect(await getToken()).toBeNull();
  });

  it("saves and retrieves user profile JSON", async () => {
    const dummyUser: UserDto = {
      id: "uuid-123",
      name: "Jane Tester",
      email: "jane@test.com",
      createdAt: "2026-10-10T00:00:00.000Z",
    };

    expect(await getUser()).toBeNull();
    await saveUser(dummyUser);
    expect(await getUser()).toEqual(dummyUser);
  });

  it("clears entire session", async () => {
    await saveToken("token-gamma");
    await saveUser({
      id: "u-1",
      name: "User",
      email: "u@u.com",
      createdAt: "now",
    });

    await clearSession();
    expect(await getToken()).toBeNull();
    expect(await getUser()).toBeNull();
  });

  it("handles corrupted stored JSON gracefully by returning null", async () => {
    await setItemAsync("ace_user_profile", "not-a-valid-json");
    expect(await getUser()).toBeNull();
  });
});

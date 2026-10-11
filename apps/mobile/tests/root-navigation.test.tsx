import React from "react";
import { describe, expect, it, vi } from "vitest";
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup: (element: React.ReactElement) => string;
};

vi.mock("expo-router", () => ({
  Slot: () => React.createElement("div", { "data-root-slot": "mounted" }),
  useRouter: () => ({ replace: vi.fn() }),
  useSegments: () => ["(app)"],
}));
vi.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("expo-status-bar", () => ({ StatusBar: () => null }));
vi.mock("../src/providers/QueryProvider.js", () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("../src/providers/AuthProvider.js", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ status: "restoring" }),
}));
vi.mock("../src/components/feedback/Toast.js", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import RootLayout from "../app/_layout.js";

describe("root navigation", () => {
  it("mounts the router slot while restoring the session", () => {
    expect(renderToStaticMarkup(React.createElement(RootLayout))).toContain(
      'data-root-slot="mounted"'
    );
  });
});

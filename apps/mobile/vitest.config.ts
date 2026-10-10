import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: [path.resolve(__dirname, "tests/setup.ts")],
  },
  resolve: {
    alias: {
      "react-native": path.resolve(__dirname, "tests/mocks/react-native.ts"),
      "@expo/vector-icons/Ionicons": path.resolve(__dirname, "tests/mocks/vector-icons.ts"),
      "@expo/vector-icons": path.resolve(__dirname, "tests/mocks/vector-icons.ts"),
      "expo-constants": path.resolve(__dirname, "tests/mocks/expo-constants.ts"),
      "expo-secure-store": path.resolve(__dirname, "tests/mocks/secure-store.ts"),
      "expo-router": path.resolve(__dirname, "tests/mocks/expo-router.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});

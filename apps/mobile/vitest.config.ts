import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "react-native": path.resolve(__dirname, "tests/mocks/react-native.ts"),
      "@expo/vector-icons/Ionicons": path.resolve(__dirname, "tests/mocks/vector-icons.ts"),
      "@expo/vector-icons": path.resolve(__dirname, "tests/mocks/vector-icons.ts"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});

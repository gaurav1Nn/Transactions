import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "ACE Transactions",
  slug: "ace-transactions",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: "acetransactions",
  splash: {
    backgroundColor: "#172041",
    resizeMode: "contain",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.ace.transactions",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#172041",
    },
    package: "com.ace.transactions",
  },
  plugins: ["expo-router", "expo-secure-store"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
    eas: {
      projectId: "ace-transactions-mock-project-id",
    },
  },
});

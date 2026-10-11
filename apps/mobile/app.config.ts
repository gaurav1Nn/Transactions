import { ExpoConfig, ConfigContext } from "expo/config";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (process.env.EAS_BUILD === "true" && !apiUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_URL must be set in the selected EAS environment before building an installable app"
  );
}

if (apiUrl && !/^https:\/\//.test(apiUrl)) {
  throw new Error("EXPO_PUBLIC_API_URL must use HTTPS");
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "ACE Transactions",
  slug: "ace-transactions",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: "acetransactions",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.ace.transactions",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#172041",
    },
    package: "com.ace.transactions",
    permissions: ["INTERNET", "ACCESS_NETWORK_STATE"],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    ["expo-splash-screen", { backgroundColor: "#172041", resizeMode: "contain" }],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: apiUrl ? { apiUrl } : {},
});

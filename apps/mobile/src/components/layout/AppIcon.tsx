import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../theme/colors";

export const iconGlyphMap = {
  home: "home-outline",
  history: "receipt-outline",
  create: "add-circle-outline",
  profile: "person-outline",
  statusPending: "time-outline",
  statusSuccess: "checkmark-circle-outline",
  statusFailed: "close-circle-outline",
  email: "mail-outline",
  password: "lock-closed-outline",
  showPassword: "eye-outline",
  hidePassword: "eye-off-outline",
  back: "arrow-back",
  close: "close",
  forward: "chevron-forward",
  next: "arrow-forward",
  share: "share-outline",
  refresh: "refresh-outline",
  offline: "cloud-offline-outline",
  info: "information-circle-outline",
  warning: "alert-circle-outline",
  secure: "shield-checkmark-outline",
  logout: "log-out-outline",
  sandbox: "flask-outline",
  copy: "copy-outline",
} as const;

export type SemanticIconName = keyof typeof iconGlyphMap;

export interface AppIconProps {
  name: SemanticIconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

export function AppIcon({
  name,
  size = 20,
  color = colors.ink,
  accessibilityLabel,
}: AppIconProps): React.JSX.Element {
  const glyph = iconGlyphMap[name] || "help-outline";
  return (
    <Ionicons
      name={glyph as keyof typeof Ionicons.glyphMap}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
    />
  );
}

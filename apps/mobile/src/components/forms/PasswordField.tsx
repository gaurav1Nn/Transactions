import React, { useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { AppTextField, AppTextFieldProps } from "./AppTextField.js";
import { AppIcon } from "../layout/AppIcon.js";
import { colors } from "../../theme/colors.js";
import { hit } from "../../theme/spacing.js";

export type PasswordFieldProps = Omit<
  AppTextFieldProps,
  "secureTextEntry" | "trailingAction"
>;

export function PasswordField({
  leadingIcon = "password",
  ...props
}: PasswordFieldProps): React.JSX.Element {
  const [showPassword, setShowPassword] = useState(false);

  const toggleLabel = showPassword ? "Hide password" : "Show password";

  const trailingAction = (
    <TouchableOpacity
      onPress={() => setShowPassword((prev) => !prev)}
      hitSlop={hit.slop}
      style={styles.toggleButton}
      accessibilityRole="button"
      accessibilityLabel={toggleLabel}
    >
      <AppIcon
        name={showPassword ? "hidePassword" : "showPassword"}
        size={20}
        color={colors.inkMuted}
      />
    </TouchableOpacity>
  );

  return (
    <AppTextField
      secureTextEntry={!showPassword}
      leadingIcon={leadingIcon}
      trailingAction={trailingAction}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    width: hit.minSize,
    height: hit.minSize,
    justifyContent: "center",
    alignItems: "center",
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { colors } from "../../theme/colors.js";
import { space, radius, border } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";
import { AppIcon, SemanticIconName } from "../layout/AppIcon.js";

export interface AppTextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: SemanticIconName;
  trailingAction?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function AppTextField({
  label,
  error,
  helperText,
  leadingIcon,
  trailingAction,
  containerStyle,
  onFocus,
  onBlur,
  secureTextEntry,
  accessibilityHint,
  ...restProps
}: AppTextFieldProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error);

  const handleFocus: TextInputProps["onFocus"] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps["onBlur"] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, typography.eyebrow]}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
        ]}
      >
        {Boolean(leadingIcon) && (
          <View style={styles.leadingIcon}>
            <AppIcon
              name={leadingIcon!}
              size={20}
              color={isFocused ? colors.primary : colors.inkMuted}
            />
          </View>
        )}
        <TextInput
          style={[styles.input, typography.body]}
          placeholderTextColor={colors.inkMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint || helperText}
          aria-invalid={hasError}
          {...restProps}
        />
        {Boolean(trailingAction) && (
          <View style={styles.trailingAction}>{trailingAction}</View>
        )}
      </View>
      {hasError ? (
        <View style={styles.feedbackRow} accessibilityRole="alert">
          <AppIcon name="warning" size={14} color={colors.failed} />
          <Text style={[styles.errorText, typography.caption]}>{error}</Text>
        </View>
      ) : Boolean(helperText) ? (
        <Text style={[styles.helperText, typography.caption]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: space.sm,
  },
  label: {
    color: colors.inkSoft,
    marginBottom: space.xs,
  },
  inputContainer: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: border.field,
    borderColor: colors.borderStrong,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: border.focus,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.failed,
    borderWidth: border.focus,
  },
  leadingIcon: {
    marginRight: space.sm,
  },
  input: {
    flex: 1,
    height: "100%",
    color: colors.ink,
    paddingVertical: 0,
  },
  trailingAction: {
    marginLeft: space.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: space.xs,
  },
  errorText: {
    color: colors.failed,
    marginLeft: space.xs,
  },
  helperText: {
    color: colors.inkMuted,
    marginTop: space.xs,
  },
});

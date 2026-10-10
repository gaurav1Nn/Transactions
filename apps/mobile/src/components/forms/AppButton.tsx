import React, { useRef } from "react";
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Pressable,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { colors } from "../../theme/colors.js";
import { space, radius } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";
import { AppIcon, SemanticIconName } from "../layout/AppIcon.js";

export type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";

export interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: SemanticIconName;
  trailingIcon?: SemanticIconName;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  loadingLabel,
  leadingIcon,
  trailingIcon,
  style,
  textStyle,
  fullWidth = true,
}: AppButtonProps): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isInteractive = !disabled && !loading;

  const handlePressIn = () => {
    if (!isInteractive) return;
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!isInteractive || !onPress) return;
    onPress();
  };

  const currentStyles = variantMap[variant];
  const textColor =
    typeof currentStyles.text.color === "string"
      ? currentStyles.text.color
      : colors.surface;
  const displayLabel = loading && loadingLabel ? loadingLabel : label;

  return (
    <Animated.View
      style={[
        styles.animatedWrap,
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isInteractive}
        accessibilityRole="button"
        accessibilityLabel={displayLabel}
        accessibilityState={{
          disabled: !isInteractive,
          busy: loading,
        }}
        style={[
          styles.button,
          currentStyles.container,
          disabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <View style={styles.contentRow}>
            <ActivityIndicator
              size="small"
              color={textColor}
              style={styles.spinner}
            />
            <Text
              style={[
                styles.text,
                typography.bodyStrong,
                currentStyles.text,
                textStyle,
              ]}
            >
              {displayLabel}
            </Text>
          </View>
        ) : (
          <View style={styles.contentRow}>
            {Boolean(leadingIcon) && (
              <View style={styles.leadingIconWrap}>
                <AppIcon name={leadingIcon!} size={20} color={textColor} />
              </View>
            )}
            <Text
              style={[
                styles.text,
                typography.bodyStrong,
                currentStyles.text,
                textStyle,
              ]}
            >
              {displayLabel}
            </Text>
            {Boolean(trailingIcon) && (
              <View style={styles.trailingIconWrap}>
                <AppIcon name={trailingIcon!} size={20} color={textColor} />
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const variantMap: Record<
  ButtonVariant,
  {
    container: ViewStyle;
    text: TextStyle;
  }
> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      borderWidth: 0,
    },
    text: {
      color: colors.surface,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    text: {
      color: colors.ink,
    },
  },
  success: {
    container: {
      backgroundColor: colors.successBg,
      borderWidth: 1,
      borderColor: colors.successBorder,
    },
    text: {
      color: colors.success,
    },
  },
  danger: {
    container: {
      backgroundColor: colors.failedBg,
      borderWidth: 1,
      borderColor: colors.failedBorder,
    },
    text: {
      color: colors.failed,
    },
  },
  ghost: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    text: {
      color: colors.primary,
    },
  },
};

const styles = StyleSheet.create({
  animatedWrap: {
    alignSelf: "stretch",
  },
  fullWidth: {
    width: "100%",
  },
  button: {
    height: 52,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginRight: space.sm,
  },
  leadingIconWrap: {
    marginRight: space.sm,
  },
  trailingIconWrap: {
    marginLeft: space.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    textAlign: "center",
  },
});

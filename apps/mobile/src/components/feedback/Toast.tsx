import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors.js";
import { space, radius, elevation } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";
import { AppIcon } from "../layout/AppIcon.js";

export type ToastVariant = "info" | "success" | "error";

interface ToastState {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [current, setCurrent] = useState<ToastState | null>(null);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();
  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      clearTimeout(timerRef.current as NodeJS.Timeout);
      const id = String(Date.now());
      setCurrent({ id, message, variant });

      AccessibilityInfo.announceForAccessibility(message);

      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setCurrent(null);
        });
      }, 4000);
    },
    [opacityAnim]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {Boolean(current) && (
        <Animated.View
          style={[
            styles.toastWrapper,
            {
              bottom: Math.max(insets.bottom, 16) + 16,
              opacity: opacityAnim,
            },
          ]}
          pointerEvents="none"
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <View
            style={[
              styles.toast,
              current?.variant === "error" && styles.toastError,
              current?.variant === "success" && styles.toastSuccess,
            ]}
          >
            <AppIcon
              name={
                current?.variant === "success"
                  ? "statusSuccess"
                  : current?.variant === "error"
                  ? "statusFailed"
                  : "info"
              }
              size={18}
              color={colors.surface}
            />
            <Text style={[styles.text, typography.bodySm]}>
              {current?.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    left: space.gutter,
    right: space.gutter,
    alignItems: "center",
    zIndex: 9999,
    elevation: elevation.toast,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.navy,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.control,
    maxWidth: "100%",
    ...Platform.select({
      ios: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
  toastError: {
    backgroundColor: colors.failed,
  },
  toastSuccess: {
    backgroundColor: colors.success,
  },
  text: {
    color: colors.surface,
    marginLeft: space.sm,
    flexShrink: 1,
  },
});

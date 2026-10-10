import React from "react";

export const Platform = {
  OS: "android",
  select: (obj: Record<string, unknown>) => obj.android ?? obj.default,
};

export const StyleSheet = {
  create: (styles: Record<string, unknown>) => styles,
  flatten: (style: unknown) => style,
};

export const AccessibilityInfo = {
  isReduceMotionEnabled: () => Promise.resolve(false),
  addEventListener: () => ({ remove: () => {} }),
  announceForAccessibility: () => {},
};

export const View = (props: Record<string, unknown>) => React.createElement("View", props, props.children as React.ReactNode);
export const Text = (props: Record<string, unknown>) => React.createElement("Text", props, props.children as React.ReactNode);
export const TouchableOpacity = (props: Record<string, unknown>) => React.createElement("TouchableOpacity", props, props.children as React.ReactNode);
export const TouchableWithoutFeedback = (props: Record<string, unknown>) => React.createElement("TouchableWithoutFeedback", props, props.children as React.ReactNode);
export const ActivityIndicator = (props: Record<string, unknown>) => React.createElement("ActivityIndicator", props);
export const ScrollView = (props: Record<string, unknown>) => React.createElement("ScrollView", props, props.children as React.ReactNode);
export const KeyboardAvoidingView = (props: Record<string, unknown>) => React.createElement("KeyboardAvoidingView", props, props.children as React.ReactNode);
export const Keyboard = {
  dismiss: () => {},
};

export const Animated = {
  Value: class {
    private val: number;
    constructor(v: number) { this.val = v; }
    setValue(v: number) { this.val = v; }
  },
  timing: () => ({ start: (cb?: () => void) => cb?.(), stop: () => {} }),
  sequence: () => ({ start: (cb?: () => void) => cb?.(), stop: () => {} }),
  loop: () => ({ start: () => {}, stop: () => {} }),
  View: (props: Record<string, unknown>) => React.createElement("Animated.View", props, props.children as React.ReactNode),
};

export default {
  Platform,
  StyleSheet,
  AccessibilityInfo,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
};

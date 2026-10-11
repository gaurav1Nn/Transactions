import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
} from "react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon, SemanticIconName } from "./AppIcon";
import { colors } from "../../theme/colors";
import { space, radius, border, hit } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface TabConfig {
  name: string;
  label: string;
  icon: SemanticIconName;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: "index",
    label: "Home",
    icon: "home",
  },
  "transactions/index": {
    name: "transactions/index",
    label: "History",
    icon: "history",
  },
  "transactions/create": {
    name: "transactions/create",
    label: "Create",
    icon: "create",
  },
  profile: {
    name: "profile",
    label: "Profile",
    icon: "profile",
  },
};

export function AppTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Hide tab bar when keyboard is open
  if (isKeyboardVisible) {
    return null;
  }

  // Active route
  const currentRoute = state.routes[state.index];
  const focusedOptions = descriptors[currentRoute.key]?.options;

  // Hide tab bar if screen requested tabBarStyle display: none (like Details screen)
  if (
    focusedOptions?.tabBarStyle &&
    (focusedOptions.tabBarStyle as { display?: string }).display === "none"
  ) {
    return null;
  }

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom: Math.max(insets.bottom, space.xs),
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIGS[route.name];

        // Skip routes not intended as visible tabs (e.g. details)
        if (!config) {
          return null;
        }

        const isCreate = route.name === "transactions/create";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
            hitSlop={hit.slop}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={`${config.label} tab`}
          >
            {/* Active Indicator Bar */}
            {isFocused && !isCreate ? (
              <View style={styles.indicatorBar} />
            ) : (
              <View style={styles.indicatorSpacer} />
            )}

            {isCreate ? (
              <View style={styles.createButtonCircle}>
                <AppIcon name="create" size={24} color={colors.surface} />
              </View>
            ) : (
              <AppIcon
                name={config.icon}
                size={22}
                color={isFocused ? colors.primary : colors.inkSoft}
              />
            )}

            <Text
              style={[
                styles.tabLabel,
                typography.caption,
                {
                  color: isCreate
                    ? colors.primary
                    : isFocused
                    ? colors.primary
                    : colors.inkSoft,
                  fontWeight: isFocused || isCreate ? "600" : "400",
                },
              ]}
              numberOfLines={1}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: border.card,
    borderTopColor: colors.border,
  },
  tabButton: {
    flex: 1,
    // Keep tab content above the system navigation area; its inset is added
    // separately by the container's bottom padding.
    minHeight: 72,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
    paddingBottom: space.xs,
  },
  indicatorBar: {
    width: 24,
    height: 3,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  indicatorSpacer: {
    height: 3,
  },
  createButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
});

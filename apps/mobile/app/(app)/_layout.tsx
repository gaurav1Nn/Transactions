import React from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { colors } from "../../src/theme/colors.js";
import { space } from "../../src/theme/spacing.js";
import { typography } from "../../src/theme/typography.js";
import { AppIcon } from "../../src/components/layout/AppIcon.js";

export default function AppLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: [styles.tabLabel, typography.caption],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions/index"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions/create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <View style={styles.createIconWrap}>
              <AppIcon name="create" size={size + 2} color={colors.surface} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="profile" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions/[id]"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: space.xs,
    paddingTop: space.xs,
  },
  tabLabel: {
    fontWeight: "600",
  },
  createIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});

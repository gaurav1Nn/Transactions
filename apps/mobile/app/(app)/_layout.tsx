import React from "react";
import { Tabs } from "expo-router";
import { AppTabBar } from "../../src/components/layout/AppTabBar.js";

export default function AppLayout(): React.JSX.Element {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      backBehavior="history"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="transactions/index"
        options={{
          title: "History",
        }}
      />
      <Tabs.Screen
        name="transactions/create"
        options={{
          title: "Create",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
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

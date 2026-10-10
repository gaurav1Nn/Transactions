import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors.js";
import { space, radius, border } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";
import { ScreenContainer } from "../../components/layout/ScreenContainer.js";
import { SegmentedControl } from "../../components/forms/SegmentedControl.js";

export interface AuthShellProps {
  currentTab: "login" | "register";
  title?: string;
  tagline?: string;
  children: React.ReactNode;
  footerAction?: React.ReactNode;
}

export function AuthShell({
  currentTab,
  title = "ACE Transactions",
  tagline = "Create, simulate and track payments.",
  children,
  footerAction,
}: AuthShellProps): React.JSX.Element {
  const router = useRouter();

  const handleTabChange = (val: "login" | "register") => {
    if (val === currentTab) return;
    if (val === "login") {
      router.replace("/(auth)/login");
    } else {
      router.replace("/(auth)/register");
    }
  };

  return (
    <ScreenContainer scroll keyboardAvoiding>
      <View style={styles.shell}>
        {/* Brand Block */}
        <View style={styles.brandBlock}>
          <View style={styles.logoTile}>
            <View style={styles.innerBadge}>
              <Text style={styles.logoLetter}>A</Text>
            </View>
          </View>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, typography.title]}
              accessibilityRole="header"
            >
              {title}
            </Text>
            <View style={styles.sandboxBadge}>
              <Text style={[styles.sandboxText, typography.eyebrow]}>
                SANDBOX
              </Text>
            </View>
          </View>
          <Text style={[styles.tagline, typography.bodySm]}>{tagline}</Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.switcherWrap}>
          <SegmentedControl
            options={[
              { value: "login", label: "Sign in" },
              { value: "register", label: "Register" },
            ]}
            value={currentTab}
            onChange={handleTabChange}
          />
        </View>

        {/* Form Card */}
        <View style={styles.card}>{children}</View>

        {/* Footer */}
        {Boolean(footerAction) && (
          <View style={styles.footerAction}>{footerAction}</View>
        )}

        <View style={styles.footnoteRow}>
          <Text style={[styles.footnote, typography.caption]}>
            🛡 Your session is kept in your device's secure storage.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
    paddingVertical: space.xl,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: space.xl,
  },
  logoTile: {
    width: 72,
    height: 72,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: space.md,
    borderWidth: border.card,
    borderColor: colors.border,
  },
  innerBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  logoLetter: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "serif",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.xs,
  },
  title: {
    color: colors.ink,
  },
  sandboxBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.badge,
    marginLeft: space.sm,
  },
  sandboxText: {
    color: colors.primary,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  tagline: {
    color: colors.inkSoft,
    textAlign: "center",
  },
  switcherWrap: {
    marginBottom: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: border.card,
    borderColor: colors.border,
    padding: space.cardPadding,
  },
  footerAction: {
    marginTop: space.lg,
    alignItems: "center",
  },
  footnoteRow: {
    marginTop: space.xl,
    alignItems: "center",
    paddingHorizontal: space.md,
  },
  footnote: {
    color: colors.inkMuted,
    textAlign: "center",
  },
});

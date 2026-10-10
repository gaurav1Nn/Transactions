import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors.js";
import { space, hit } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";
import { AppIcon } from "./AppIcon.js";

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}: AppHeaderProps): React.JSX.Element {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={hit.slop}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="back" size={24} color={colors.ink} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, typography.title]} numberOfLines={1}>
            {title}
          </Text>
          {Boolean(subtitle) && (
            <Text style={[styles.subtitle, typography.caption]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {Boolean(rightAction) && <View style={styles.right}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.gutter,
    backgroundColor: colors.background,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: space.md,
    width: hit.minSize,
    height: hit.minSize,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: colors.ink,
  },
  subtitle: {
    color: colors.inkSoft,
    marginTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: space.md,
  },
});

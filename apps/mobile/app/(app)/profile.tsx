import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider.js";
import { useProfile } from "../../src/features/profile/useProfile.js";
import { ScreenContainer } from "../../src/components/layout/ScreenContainer.js";
import { AppHeader } from "../../src/components/layout/AppHeader.js";
import { Avatar } from "../../src/components/layout/Avatar.js";
import { AppButton } from "../../src/components/forms/AppButton.js";
import { ConfirmDialog } from "../../src/components/transactions/ConfirmDialog.js";
import { Skeleton } from "../../src/components/feedback/Skeleton.js";
import { ErrorState } from "../../src/components/feedback/RemoteStates.js";
import { formatMemberSince } from "../../src/utils/format-date.js";
import { BASE_URL } from "../../src/api/client.js";
import { colors } from "../../src/theme/colors.js";
import { space, radius, border } from "../../src/theme/spacing.js";
import { typography } from "../../src/theme/typography.js";

function getHostName(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "localhost";
  }
}

export default function ProfileScreen(): React.JSX.Element {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { signOut } = useAuth();
  const router = useRouter();
  const { user, isLoading, isError, errorMessage, refetch, isRefetching } = useProfile();

  const serverHost = getHostName(BASE_URL);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      setShowLogoutConfirm(false);
      router.replace("/(auth)/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ScreenContainer padded={false}>
      <AppHeader title="Profile" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading && !user ? (
          <View style={styles.contentWrap}>
            <Skeleton height={120} borderRadius={radius.card} />
            <Skeleton height={80} borderRadius={radius.card} />
            <Skeleton height={140} borderRadius={radius.card} />
          </View>
        ) : isError && !user ? (
          <ErrorState
            title="Failed to load profile"
            message={errorMessage || "Unable to reach server"}
            onRetry={refetch}
          />
        ) : (
          <View style={styles.contentWrap}>
            {/* Identity Card */}
            <View style={styles.card}>
              <View style={styles.identityRow}>
                <Avatar name={user?.name || "User"} size={64} />
                <View style={styles.identityInfo}>
                  <Text style={[styles.name, typography.title]} numberOfLines={1}>
                    {user?.name}
                  </Text>
                  <Text style={[styles.email, typography.body]}>
                    {user?.email}
                  </Text>
                  {Boolean(user?.createdAt) && (
                    <Text style={[styles.memberSince, typography.caption]}>
                      {formatMemberSince(user!.createdAt)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Session Card */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, typography.eyebrow]}>
                SESSION
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={[styles.sessionTitle, typography.bodyStrong]}>
                🛡 Signed in on this device
              </Text>
              <Text style={[styles.sessionSubtitle, typography.caption]}>
                Your session is kept in secure storage.
              </Text>
            </View>

            {/* About Card */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, typography.eyebrow]}>
                ABOUT
              </Text>
            </View>
            <View style={styles.card}>
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, typography.bodySm]}>App version</Text>
                <Text style={[styles.aboutValue, typography.bodyStrong]}>1.0.0</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, typography.bodySm]}>Server</Text>
                <Text style={[styles.aboutValue, typography.bodyStrong]}>{serverHost}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.aboutRow}>
                <Text style={[styles.aboutLabel, typography.bodySm]}>Mode</Text>
                <Text style={[styles.aboutValue, typography.bodyStrong]}>Sandbox</Text>
              </View>
            </View>

            {/* Log Out Action */}
            <View style={styles.logoutWrap}>
              <AppButton
                label="Log out"
                variant="danger"
                leadingIcon="logout"
                onPress={() => setShowLogoutConfirm(true)}
              />
            </View>

            <Text style={[styles.footerVersion, typography.caption]}>
              ACE Transactions v1.0.0
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Log out?"
        message="You'll need to sign in again to access your account."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        confirmVariant="danger"
        loading={isLoggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: space.huge,
  },
  contentWrap: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    gap: space.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: border.card,
    borderColor: colors.border,
    padding: space.cardPadding,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  identityInfo: {
    marginLeft: space.lg,
    flex: 1,
  },
  name: {
    color: colors.ink,
  },
  email: {
    color: colors.inkSoft,
    marginTop: 2,
  },
  memberSince: {
    color: colors.inkMuted,
    marginTop: space.xs,
  },
  sectionHeader: {
    marginTop: space.sm,
    marginBottom: -space.xs,
  },
  sectionTitle: {
    color: colors.inkMuted,
  },
  sessionTitle: {
    color: colors.ink,
  },
  sessionSubtitle: {
    color: colors.inkSoft,
    marginTop: space.xs,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space.xs,
  },
  aboutLabel: {
    color: colors.inkSoft,
  },
  aboutValue: {
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.xs,
  },
  logoutWrap: {
    marginTop: space.md,
  },
  footerVersion: {
    textAlign: "center",
    color: colors.inkMuted,
    marginTop: space.xs,
  },
});

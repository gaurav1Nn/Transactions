import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { colors } from "../../theme/colors.js";
import { space, radius, elevation } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";
import { AppButton, ButtonVariant } from "../forms/AppButton.js";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.JSX.Element {
  const handleDismiss = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.scrim}>
          <TouchableWithoutFeedback>
            <View
              style={styles.card}
              accessibilityRole="alert"
            >
              <Text style={[styles.title, typography.headline]}>{title}</Text>
              <Text style={[styles.message, typography.bodySm]}>{message}</Text>

              <View style={styles.buttonRow}>
                <View style={styles.buttonCol}>
                  <AppButton
                    label={cancelLabel}
                    variant="secondary"
                    onPress={onCancel}
                    disabled={loading}
                    fullWidth
                  />
                </View>
                <View style={styles.buttonCol}>
                  <AppButton
                    label={confirmLabel}
                    variant={confirmVariant}
                    onPress={onConfirm}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: space.gutter,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.xl,
    elevation: elevation.modal,
    ...Platform.select({
      ios: {
        shadowColor: colors.ink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
    }),
  },
  title: {
    color: colors.ink,
    marginBottom: space.sm,
  },
  message: {
    color: colors.inkSoft,
    marginBottom: space.xxl,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: space.md,
  },
  buttonCol: {
    flex: 1,
  },
});

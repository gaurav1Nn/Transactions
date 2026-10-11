import { colors } from "./colors";

export type ApiTransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface StatusMeta {
  label: "Pending" | "Success" | "Failed";
  color: string;
  backgroundColor: string;
  borderColor: string;
  onDarkColor: string;
  iconName: "statusPending" | "statusSuccess" | "statusFailed";
}

export const statusTheme: Record<ApiTransactionStatus, StatusMeta> = {
  PENDING: {
    label: "Pending",
    color: colors.pending,
    backgroundColor: colors.pendingBg,
    borderColor: colors.pendingBorder,
    onDarkColor: colors.pendingOnDark,
    iconName: "statusPending",
  },
  SUCCESS: {
    label: "Success",
    color: colors.success,
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
    onDarkColor: colors.successOnDark,
    iconName: "statusSuccess",
  },
  FAILED: {
    label: "Failed",
    color: colors.failed,
    backgroundColor: colors.failedBg,
    borderColor: colors.failedBorder,
    onDarkColor: colors.failedOnDark,
    iconName: "statusFailed",
  },
};

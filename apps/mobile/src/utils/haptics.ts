import * as Haptics from "expo-haptics";

// Haptics are a nicety: never let a missing or unsupported device break an action.
function run(effect: () => Promise<void>): void {
  try {
    effect().catch(() => undefined);
  } catch {
    // ignored
  }
}

export const haptics = {
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () =>
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () =>
    run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

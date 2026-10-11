export function shouldPromptBeforeLeavingTransaction({
  hasUnsavedInput,
  isSubmitting,
  discardConfirmed,
}: {
  hasUnsavedInput: boolean;
  isSubmitting: boolean;
  discardConfirmed: boolean;
}): boolean {
  return hasUnsavedInput && !isSubmitting && !discardConfirmed;
}

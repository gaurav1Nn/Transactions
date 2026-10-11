import { describe, expect, it } from "vitest";
import easConfig from "../eas.json";

describe("Android build configuration", () => {
  it("does not embed any API URL in the preview APK", () => {
    const previewEnvironment = (
      easConfig.build.preview as { env?: Record<string, string> }
    ).env ?? {};

    expect(previewEnvironment.EXPO_PUBLIC_API_URL).toBeUndefined();
  });
});

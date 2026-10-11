import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { renderToStaticMarkup } = require("react-dom/server") as {
  renderToStaticMarkup: (element: React.ReactElement) => string;
};

const native = vi.hoisted(() => ({
  platform: "android",
  scrollProps: {} as Record<string, any>,
  avoidingProps: {} as Record<string, any>,
  keyboardVisible: false,
  inputTop: 570,
  focusedInput: { measureLayout: vi.fn(), measureInWindow: vi.fn() },
  scrollToKeyboard: vi.fn(),
  frames: [] as FrameRequestCallback[],
}));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 30, left: 0, right: 0 }),
}));
vi.mock("react-native", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-native")>();
  return {
    ...original,
    Platform: { get OS() { return native.platform; } },
    View: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", null, children),
    ScrollView: (props: Record<string, any>) => {
      native.scrollProps = props;
      const instance = { scrollResponderScrollNativeHandleToKeyboard: native.scrollToKeyboard };
      if (typeof props.ref === "function") props.ref(instance);
      else if (props.ref) props.ref.current = instance;
      return React.createElement("div", null, props.children);
    },
    KeyboardAvoidingView: (props: Record<string, any>) => {
      native.avoidingProps = props;
      return React.createElement("div", null, props.children);
    },
    TouchableWithoutFeedback: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-intercepts-form-touches": true }, children),
    Keyboard: {
      isVisible: () => native.keyboardVisible,
      metrics: () => ({ screenY: 600 }),
      addListener: () => ({ remove: vi.fn() }),
      dismiss: vi.fn(),
    },
    TextInput: { State: { currentlyFocusedInput: () => native.focusedInput } },
  };
});

import { ScreenContainer } from "../src/components/layout/ScreenContainer";

describe("shared form scrolling", () => {
  beforeEach(() => {
    native.platform = "android";
    native.keyboardVisible = false;
    native.inputTop = 570;
    native.focusedInput.measureInWindow.mockImplementation((callback) => callback(0, native.inputTop, 200, 40));
    native.frames = [];
    native.scrollToKeyboard.mockClear();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      native.frames.push(callback);
      return native.frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it("allows form swipes without a page-wide press responder", () => {
    const markup = renderToStaticMarkup(
      <ScreenContainer scroll keyboardAvoiding>
        <p>Simulation mode</p><button>Create transaction</button>
      </ScreenContainer>
    );
    expect(markup).not.toContain("data-intercepts-form-touches");
    expect(markup).toContain("Create transaction");
    expect(native.scrollProps.keyboardDismissMode).toBe("on-drag");
    expect(native.scrollProps.keyboardShouldPersistTaps).toBe("handled");
  });

  it("resizes Android forms while the keyboard is open", () => {
    renderToStaticMarkup(<ScreenContainer scroll keyboardAvoiding><input /></ScreenContainer>);
    expect(native.avoidingProps.behavior).toBe("height");
  });

  it("uses interactive keyboard dismissal and padding on iOS", () => {
    native.platform = "ios";
    renderToStaticMarkup(<ScreenContainer scroll keyboardAvoiding><input /></ScreenContainer>);
    expect(native.avoidingProps.behavior).toBe("padding");
    expect(native.scrollProps.keyboardDismissMode).toBe("interactive");
  });

  it("reveals the focused input after the keyboard resizes the viewport", () => {
    renderToStaticMarkup(<ScreenContainer scroll keyboardAvoiding><input /></ScreenContainer>);
    native.keyboardVisible = true;
    native.scrollProps.onLayout?.();
    for (const callback of native.frames.splice(0)) callback(0);
    expect(native.scrollToKeyboard).toHaveBeenCalledWith(native.focusedInput, 70, true);
  });

  it("keeps an already visible input in place when the keyboard opens", () => {
    renderToStaticMarkup(<ScreenContainer scroll keyboardAvoiding><input /></ScreenContainer>);
    native.inputTop = 100;
    native.keyboardVisible = true;
    native.scrollProps.onLayout?.();
    for (const callback of native.frames.splice(0)) callback(0);
    expect(native.scrollToKeyboard).not.toHaveBeenCalled();
  });

  it("does not add the tab bar's bottom inset again on Create", () => {
    renderToStaticMarkup(<ScreenContainer scroll keyboardAvoiding bottomSafeArea={false}><input /></ScreenContainer>);
    native.keyboardVisible = true;
    native.scrollProps.onLayout?.();
    for (const callback of native.frames.splice(0)) callback(0);
    expect(native.scrollToKeyboard).toHaveBeenCalledWith(native.focusedInput, 40, true);
  });

  it("does not jump back to an input after the keyboard is dismissed", () => {
    renderToStaticMarkup(<ScreenContainer scroll keyboardAvoiding><input /></ScreenContainer>);
    native.scrollProps.onLayout?.();
    for (const callback of native.frames.splice(0)) callback(0);
    expect(native.scrollToKeyboard).not.toHaveBeenCalled();
  });
});

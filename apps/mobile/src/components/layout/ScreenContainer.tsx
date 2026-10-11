import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { space } from "../../theme/spacing";

const FormKeyboardContext = createContext<(() => void) | null>(null);

export function useRevealFocusedInput() {
  return useContext(FormKeyboardContext);
}

export interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  keyboardAvoiding?: boolean;
  scrollRef?: React.Ref<ScrollView>;
  bottomSafeArea?: boolean;
}

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  style,
  contentContainerStyle,
  keyboardAvoiding = Platform.OS === "ios",
  scrollRef,
  bottomSafeArea = true,
}: ScreenContainerProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const internalScrollRef = useRef<ScrollView | null>(null);
  const focusFrameRef = useRef<number | null>(null);

  const setScrollRef = useCallback((instance: ScrollView | null) => {
    internalScrollRef.current = instance;
    if (typeof scrollRef === "function") scrollRef(instance);
    else if (scrollRef) scrollRef.current = instance;
  }, [scrollRef]);

  const revealFocusedInput = useCallback(() => {
    if (!scroll || !keyboardAvoiding) return;
    if (focusFrameRef.current !== null) cancelAnimationFrame(focusFrameRef.current);
    focusFrameRef.current = requestAnimationFrame(() => {
      focusFrameRef.current = null;
      if (!Keyboard.isVisible()) return;
      const input = TextInput.State.currentlyFocusedInput();
      if (!input) return;
      input.measureInWindow((_x, y, _width, height) => {
        const keyboard = Keyboard.metrics();
        if (!keyboard || !Keyboard.isVisible() ||
          TextInput.State.currentlyFocusedInput() !== input) return;
        const bottomInset = bottomSafeArea ? insets.bottom : 0;
        if (y + height <= keyboard.screenY - bottomInset - space.lg) return;
        // The native responder measures from the scroll content, while the
        // keyboard coordinates include the screen's safe-area offsets.
        internalScrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
          input, insets.top + bottomInset + space.lg, true
        );
      });
    });
  }, [scroll, keyboardAvoiding, bottomSafeArea, insets.top, insets.bottom]);

  useEffect(() => {
    if (!scroll || !keyboardAvoiding) return;
    const show = Keyboard.addListener("keyboardDidShow", revealFocusedInput);
    return () => {
      show.remove();
      if (focusFrameRef.current !== null) cancelAnimationFrame(focusFrameRef.current);
    };
  }, [scroll, keyboardAvoiding, revealFocusedInput]);

  const containerPadding = {
    paddingTop: insets.top,
    paddingBottom: bottomSafeArea ? insets.bottom : 0,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const horizontalPadding = padded ? { paddingHorizontal: space.gutter } : undefined;

  const innerContent = scroll ? (
    <ScrollView
      ref={setScrollRef}
      onLayout={revealFocusedInput}
      style={[styles.scroll, style]}
      contentContainerStyle={[
        styles.scrollContent,
        horizontalPadding,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustKeyboardInsets={false}
      scrollsChildToFocus
      removeClippedSubviews={false}
      showsVerticalScrollIndicator
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, horizontalPadding, style]}>
      {children}
    </View>
  );

  // The safe-area padding belongs to the content, so keyboard avoidance does
  // not overwrite it. The ScrollView owns gestures and outside taps itself.
  const content = <View style={[styles.flex, containerPadding]}>{innerContent}</View>;

  return (
    <FormKeyboardContext.Provider value={revealFocusedInput}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.root}>{content}</View>
      )}
    </FormKeyboardContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
});

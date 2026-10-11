import React, { useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = radius.control,
  style,
}: SkeletonProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacityAnim.setValue(0.6);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [reducedMotion, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
      accessibilityRole="none"
      accessibilityLabel="Loading content"
      accessible={true}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceMuted,
  },
});

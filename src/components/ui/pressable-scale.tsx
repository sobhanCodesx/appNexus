import * as Haptics from 'expo-haptics';
import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { motion } from '@/design';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PropsWithChildren<PressableProps & {
  haptic?: boolean;
  pressedScale?: number;
}>;

export function PressableScale({
  children,
  haptic = true,
  pressedScale = 0.97,
  onPress,
  onPressIn,
  onPressOut,
  style,
  ...props
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        // Reanimated SharedValue mutation is intentionally handled by the UI runtime.
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withTiming(pressedScale, { duration: motion.quick });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(1, motion.spring);
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic) void Haptics.selectionAsync();
        onPress?.(event);
      }}>
      {children}
    </AnimatedPressable>
  );
}

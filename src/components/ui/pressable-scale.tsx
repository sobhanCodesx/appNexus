import * as Haptics from 'expo-haptics';
import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/design';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PropsWithChildren<PressableProps & {
  haptic?: boolean;
  pressedScale?: number;
  pressedOpacity?: number;
}>;

export function PressableScale({
  children,
  haptic = true,
  pressedScale = 0.97,
  pressedOpacity = 0.94,
  onPress,
  onPressIn,
  onPressOut,
  style,
  disabled,
  ...props
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      style={[style, disabled && { opacity: 0.5 }, animatedStyle]}
      onPressIn={(event) => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withTiming(pressedScale, { duration: motion.tap });
        // eslint-disable-next-line react-hooks/immutability
        opacity.value = withTiming(pressedOpacity, { duration: motion.tap });
        // eslint-disable-next-line react-hooks/immutability
        translateY.value = withTiming(1.2, { duration: motion.tap });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(1, motion.springSnappy);
        // eslint-disable-next-line react-hooks/immutability
        opacity.value = withTiming(1, { duration: motion.quick });
        // eslint-disable-next-line react-hooks/immutability
        translateY.value = withSpring(0, motion.springSnappy);
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic && !disabled) void Haptics.selectionAsync();
        onPress?.(event);
      }}>
      {children}
    </AnimatedPressable>
  );
}

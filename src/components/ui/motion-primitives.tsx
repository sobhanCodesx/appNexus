import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/design';

export function Reveal({
  children,
  delay = 0,
  distance = 14,
  style,
}: PropsWithChildren<{
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  return (
    <Animated.View
      entering={FadeInDown
        .duration(motion.deliberate)
        .delay(delay)
        .springify()
        .damping(20)
        .stiffness(150)
        .withInitialValues({
          opacity: 0,
          transform: [{ translateY: distance }],
        })}
      style={style}>
      {children}
    </Animated.View>
  );
}

export function LivePulse({
  size = 6,
  color = '#58F4FF',
}: {
  size?: number;
  color?: string;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    // Reanimated SharedValue animation intentionally runs on the UI runtime.
    // eslint-disable-next-line react-hooks/immutability
    pulse.value = withRepeat(
      withTiming(1, { duration: 1250 }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse]);

  const auraStyle = useAnimatedStyle(() => ({
    opacity: 0.10 + pulse.value * 0.22,
    transform: [{ scale: 1 + pulse.value * 1.2 }],
  }));

  return (
    <Animated.View
      style={{
        width: size * 2.5,
        height: size * 2.5,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size,
            backgroundColor: color,
          },
          auraStyle,
        ]}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
}

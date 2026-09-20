import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { palette, radii } from '@/design';

export function SkeletonBox({
  style,
  radius = radii.lg,
}: {
  style?: ViewStyle | ViewStyle[];
  radius?: number;
}) {
  const opacity = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.78,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.42,
          duration: 720,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { borderRadius: radius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonRail() {
  return (
    <View style={styles.rail}>
      <SkeletonBox style={styles.large} />
      <SkeletonBox style={styles.large} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.surfaceBright,
    overflow: 'hidden',
  },
  rail: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  large: {
    width: 280,
    height: 188,
  },
});

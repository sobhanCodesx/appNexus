import { BlurView } from 'expo-blur';
import { usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { palette, shadow } from '@/design';

export function NavigationLoader() {
  const pathname = usePathname();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    cancelAnimation(opacity);
    progress.value = 0.08;
    opacity.value = 1;
    progress.value = withTiming(0.82, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
    progress.value = withDelay(
      280,
      withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withDelay(390, withTiming(0, { duration: 180 }));
  }, [opacity, pathname, progress]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View pointerEvents="none" style={[styles.root, rootStyle]}>
      <BlurView intensity={32} tint="dark" style={styles.glass}>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, barStyle]} />
        </View>
        <View style={styles.signal}>
          <View style={styles.signalCore} />
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    zIndex: 999,
    top: 48,
    left: 18,
    right: 18,
    height: 11,
  },
  glass: {
    height: 11,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(3,5,9,0.46)',
    ...shadow.soft,
  },
  track: {
    position: 'absolute',
    top: 4,
    left: 5,
    right: 5,
    height: 2,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  bar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: palette.cyan,
    transformOrigin: 'left',
    ...shadow.cyanGlow,
  },
  signal: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalCore: {
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: palette.white,
  },
});

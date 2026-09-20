import * as Network from 'expo-network';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontWeight, palette, radii, spacing, typeScale } from '@/design';

export function ConnectivityBanner() {
  const network = Network.useNetworkState();
  const insets = useSafeAreaInsets();
  const offline = network.isConnected === false || network.isInternetReachable === false;

  if (!offline) return null;

  return (
    <View pointerEvents="none" style={[styles.root, { top: insets.top + 6 }]}>
      <View style={styles.dot} />
      <Text style={styles.text}>آفلاین هستی — محتوای کش‌شده هنوز در دسترسه</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 999,
    minHeight: 42,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,184,77,0.30)',
    backgroundColor: 'rgba(10,14,21,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: palette.warning,
  },
  text: {
    color: palette.warning,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
});

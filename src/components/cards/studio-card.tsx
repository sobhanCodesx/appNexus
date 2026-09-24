import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, shadow, spacing, typeScale } from '@/design';
import type { StudioCard as StudioItem } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo.png');

export function StudioCard({
  item,
  onPress,
}: {
  item: StudioItem;
  onPress?: () => void;
}) {
  return (
    <PressableScale onPress={onPress} pressedScale={0.97} style={styles.root}>
      <View style={styles.logoWrap}>
        <View style={styles.halo} />
        <Image
          source={item.logo_url ? { uri: item.logo_url } : fallbackImage}
          style={styles.logo}
          contentFit="cover"
          recyclingKey={String(item.id)}
        />
        <View style={styles.liveMark} />
      </View>

      <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
      <Text style={styles.meta}>{(item.channels_count || 0).toLocaleString('fa-IR')} بازی</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 102,
    alignItems: 'center',
  },
  logoWrap: {
    width: 78,
    height: 78,
    borderRadius: 27,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    ...shadow.soft,
  },
  halo: {
    position: 'absolute',
    inset: -8,
    borderRadius: 34,
    backgroundColor: 'rgba(24,124,255,0.055)',
  },
  logo: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: palette.surface,
  },
  liveMark: {
    position: 'absolute',
    right: -2,
    bottom: 8,
    width: 11,
    height: 11,
    borderRadius: 11,
    backgroundColor: palette.cyan,
    borderWidth: 2,
    borderColor: palette.ink,
    ...shadow.cyanGlow,
  },
  name: {
    color: palette.text,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  meta: {
    color: palette.textDim,
    fontSize: 9,
    marginTop: 2,
  },
});

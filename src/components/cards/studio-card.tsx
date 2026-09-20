import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, spacing, typeScale } from '@/design';
import type { StudioCard as StudioItem } from '@/types/api';

const fallbackImage = require('../../../assets/images/logo.png');

export function StudioCard({ item, onPress }: { item: StudioItem; onPress?: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.root}>
      <View style={styles.logoWrap}>
        <Image
          source={item.logo_url ? { uri: item.logo_url } : fallbackImage}
          style={styles.logo}
          contentFit="cover"
          recyclingKey={String(item.id)}
        />
      </View>
      <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
      <Text style={styles.meta}>{item.channels_count || 0} کانال</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { width: 92, alignItems: 'center' },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.30)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logo: { flex: 1, borderRadius: radii.xl - 3, backgroundColor: palette.surface },
  name: {
    color: palette.text,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  meta: { color: palette.textDim, fontSize: 10, marginTop: 2 },
});

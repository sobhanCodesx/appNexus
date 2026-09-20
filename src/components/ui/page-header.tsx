import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { PressableScale } from './pressable-scale';

export function PageHeader({
  title,
  subtitle,
  onSearch,
  avatarUrl,
}: {
  title: string;
  subtitle?: string;
  onSearch?: () => void;
  avatarUrl?: string | null;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.actions}>
        {avatarUrl ? (
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          </View>
        ) : (
          <View style={styles.brandDot}>
            <View style={styles.brandDotCore} />
          </View>
        )}

        {onSearch ? (
          <PressableScale accessibilityRole="button" onPress={onSearch} style={styles.searchButton}>
            <View style={styles.searchLens} />
            <View style={styles.searchHandle} />
          </PressableScale>
        ) : null}
      </View>

      <View style={styles.copy}>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: { flex: 1, alignItems: 'flex-end' },
  subtitle: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xxs,
  },
  title: {
    color: palette.text,
    fontSize: typeScale.displaySm,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLens: {
    width: 15,
    height: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: palette.text,
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  searchHandle: {
    position: 'absolute',
    width: 8,
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.text,
    transform: [{ rotate: '45deg' }, { translateX: 6 }, { translateY: 5 }],
  },
  brandDot: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.28)',
    backgroundColor: 'rgba(77,163,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandDotCore: {
    width: 16,
    height: 16,
    borderRadius: 6,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  avatarWrap: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radii.md,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(77,163,255,0.35)',
  },
  avatar: { flex: 1, borderRadius: radii.md - 3 },
});

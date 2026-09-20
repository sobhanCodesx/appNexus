import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { fontWeight, layout, palette, shadow, spacing, typeScale } from '@/design';
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
      <View style={styles.leading}>
        {avatarUrl ? (
          <View style={styles.avatarHalo}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
          </View>
        ) : (
          <View style={styles.brandMark}>
            <View style={styles.brandCore} />
            <View style={styles.brandSpark} />
          </View>
        )}

        {onSearch ? (
          <PressableScale accessibilityRole="button" onPress={onSearch} style={styles.searchButton}>
            <BlurView intensity={32} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.searchLens} />
            <View style={styles.searchHandle} />
          </PressableScale>
        ) : null}
      </View>

      <View style={styles.copy}>
        <View style={styles.signalRow}>
          <View style={styles.signalDot} />
          <Text style={styles.subtitle}>{subtitle || 'PLAYNEXUS SIGNAL'}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  signalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.cyan,
    ...shadow.cyanGlow,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typeScale.micro,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
  },
  title: {
    color: palette.white,
    fontSize: typeScale.displaySm,
    lineHeight: 36,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    letterSpacing: -0.7,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLens: {
    width: 14,
    height: 14,
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: palette.white,
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  searchHandle: {
    position: 'absolute',
    width: 8,
    height: 1.8,
    borderRadius: 2,
    backgroundColor: palette.white,
    transform: [{ rotate: '45deg' }, { translateX: 6 }, { translateY: 5 }],
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)',
    backgroundColor: 'rgba(24,124,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  brandCore: {
    width: 15,
    height: 15,
    borderRadius: 5,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  brandSpark: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  avatarHalo: {
    width: 46,
    height: 46,
    borderRadius: 17,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.28)',
    backgroundColor: 'rgba(24,124,255,0.08)',
    ...shadow.glow,
  },
  avatar: {
    flex: 1,
    borderRadius: 14,
  },
});

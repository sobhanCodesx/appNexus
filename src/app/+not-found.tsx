import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import {
  fontFamily,
  fontWeight,
  layout,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';

export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={styles.root}>
        <View style={styles.visual}>
          <LinearGradient
            colors={['rgba(88,244,255,0.18)', 'rgba(24,124,255,0.04)', 'rgba(3,5,9,0)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.ringLarge}>
            <View style={styles.ringMedium}>
              <View style={styles.core} />
            </View>
          </View>
          <Text style={styles.code}>404</Text>
        </View>

        <View style={styles.copy}>
          <Text style={styles.kicker}>SIGNAL NOT FOUND</Text>
          <Text style={styles.title}>این مسیر از Nexus خارج شده</Text>
          <Text style={styles.body}>
            لینک ممکنه قدیمی شده باشه یا محتوای موردنظر دیگه در دسترس نباشه.
          </Text>
        </View>

        <View style={styles.actions}>
          <PressableScale style={styles.primary} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryText}>برگشت به PlayNexus</Text>
            <View style={styles.arrow} />
          </PressableScale>

          <PressableScale style={styles.secondary} onPress={() => router.push('/search')}>
            <Text style={styles.secondaryText}>جستجو در Nexus</Text>
          </PressableScale>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visual: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  ringLarge: {
    width: 172,
    height: 172,
    borderRadius: 172,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMedium: {
    width: 108,
    height: 108,
    borderRadius: 108,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
    ...shadow.cyanGlow,
  },
  code: {
    position: 'absolute',
    bottom: 30,
    color: 'rgba(255,255,255,0.18)',
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 46,
    letterSpacing: 4,
  },
  copy: {
    maxWidth: 360,
    alignItems: 'center',
  },
  kicker: {
    color: palette.cyan,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  title: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: typeScale.titleLg,
    lineHeight: 34,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  body: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  primary: {
    minHeight: 54,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryText: {
    color: palette.ink,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: typeScale.bodySm,
  },
  arrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: palette.ink,
    transform: [{ rotate: '45deg' }],
  },
  secondary: {
    minHeight: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: palette.text,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: typeScale.bodySm,
  },
});

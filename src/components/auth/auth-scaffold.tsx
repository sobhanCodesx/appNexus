import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import {
  fontWeight,
  layout,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';

type Tone = 'cyan' | 'violet' | 'blue';

export function AuthScaffold({
  children,
  kicker,
  title,
  subtitle,
  tone = 'cyan',
  step,
}: PropsWithChildren<{
  kicker: string;
  title: string;
  subtitle: string;
  tone?: Tone;
  step?: string;
}>) {
  const accent = tone === 'violet'
    ? palette.violet
    : tone === 'blue'
      ? palette.blue
      : palette.cyan;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          <View style={styles.visual}>
            <View style={[styles.orbitOuter, { borderColor: accent + '18' }]}>
              <View style={[styles.orbitMid, { borderColor: accent + '28' }]}>
                <View style={[styles.identityCard, { borderColor: accent + '38' }]}>
                  <LinearGradient
                    colors={[accent + '22', 'rgba(8,14,23,0.90)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.identityCore, { backgroundColor: accent }]} />
                  <Text style={[styles.identityLabel, { color: accent }]}>PN</Text>
                </View>
              </View>
            </View>

            <View style={[styles.visualSignal, { backgroundColor: accent }]} />
          </View>

          <View style={styles.heading}>
            <View style={styles.headingTop}>
              {step ? <Text style={styles.step}>{step}</Text> : null}
              <View style={styles.kickerRow}>
                <View style={[styles.kickerDot, { backgroundColor: accent }]} />
                <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
              </View>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.panel}>
            <View style={[styles.panelSignal, { backgroundColor: accent }]} />
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export function AuthFieldLabel({
  label,
  meta,
}: {
  label: string;
  meta?: string;
}) {
  return (
    <View style={styles.fieldHeading}>
      {meta ? <Text style={styles.fieldMeta}>{meta}</Text> : null}
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  input: {
    minHeight: 58,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.032)',
    color: palette.white,
    paddingHorizontal: spacing.lg,
    fontSize: typeScale.bodySm,
  },
  inputLarge: {
    minHeight: 68,
    borderColor: 'rgba(88,244,255,0.18)',
    backgroundColor: 'rgba(88,244,255,0.035)',
  },
  primary: {
    minHeight: 58,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryText: {
    color: palette.ink,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  primaryArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: palette.ink,
    transform: [{ rotate: '45deg' }],
  },
  secondary: {
    minHeight: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.16)',
    backgroundColor: 'rgba(88,244,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: palette.cyan,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  link: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
  },
  error: {
    color: palette.danger,
    fontSize: typeScale.caption,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  message: {
    color: palette.warning,
    fontSize: typeScale.caption,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: palette.line,
  },
  dividerText: {
    color: palette.textDim,
    fontSize: typeScale.caption,
  },
  quickRow: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  visual: {
    height: 216,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitOuter: {
    width: 190,
    height: 190,
    borderRadius: 190,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitMid: {
    width: 126,
    height: 126,
    borderRadius: 126,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {
    width: 78,
    height: 92,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: 'rgba(8,14,23,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  identityCore: {
    width: 20,
    height: 20,
    borderRadius: 7,
    transform: [{ rotate: '45deg' }],
  },
  identityLabel: {
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  visualSignal: {
    position: 'absolute',
    bottom: 24,
    width: 38,
    height: 2,
    borderRadius: 2,
  },
  heading: {
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
  },
  headingTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kickerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  kickerDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },
  kicker: {
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  step: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.8,
  },
  title: {
    color: palette.white,
    fontSize: 33,
    lineHeight: 42,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    letterSpacing: -0.6,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 23,
    textAlign: 'right',
    marginTop: spacing.sm,
    maxWidth: 340,
  },
  panel: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(10,16,26,0.72)',
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.sm,
    ...shadow.soft,
  },
  panelSignal: {
    position: 'absolute',
    top: 0,
    right: 26,
    width: 56,
    height: 2,
  },
  fieldHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },
  fieldLabel: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
  },
  fieldMeta: {
    color: palette.textDim,
    fontSize: 9,
  },
});

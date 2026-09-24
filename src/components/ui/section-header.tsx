import { StyleSheet, Text, View } from 'react-native';

import { fontFamily, fontWeight, palette, spacing, typeScale } from '@/design';
import { PressableScale } from './pressable-scale';

export function SectionHeader({
  title,
  eyebrow,
  action,
  onAction,
  compact = false,
}: {
  title: string;
  eyebrow?: string;
  action?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? (
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
          </View>
        ) : null}
        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      </View>

      {action ? (
        onAction ? (
          <PressableScale
            haptic={false}
            onPress={onAction}
            style={styles.actionWrap}>
            <Text style={styles.action}>{action}</Text>
            <View style={styles.actionArrow} />
          </PressableScale>
        ) : (
          <View style={styles.actionWrap}>
            <Text style={styles.action}>{action}</Text>
            <View style={styles.actionArrow} />
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    alignItems: 'flex-end',
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  eyebrow: {
    color: palette.textDim,
    fontSize: typeScale.micro,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    letterSpacing: 1.1,
  },
  title: {
    color: palette.white,
    fontSize: typeScale.titleLg,
    lineHeight: 32,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  titleCompact: {
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.25,
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingBottom: 3,
  },
  action: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
  },
  actionArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.4,
    borderBottomWidth: 1.4,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
});

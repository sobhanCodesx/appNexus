import { StyleSheet, Text, View } from 'react-native';

import { fontWeight, palette, spacing, typeScale } from '@/design';

export function SectionHeader({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow?: string;
  action?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action ? <Text style={styles.action}>{action}</Text> : null}
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
  eyebrow: {
    color: palette.blue,
    fontSize: typeScale.micro,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.xxs,
  },
  title: {
    color: palette.text,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  action: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.semibold,
  },
});

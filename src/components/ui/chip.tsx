import { StyleSheet, Text } from 'react-native';

import { fontWeight, palette, radii, spacing, typeScale } from '@/design';
import { PressableScale } from './pressable-scale';

export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      haptic={Boolean(onPress)}
      onPress={onPress}
      style={[styles.root, active && styles.active]}>
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  active: {
    borderColor: 'rgba(77,163,255,0.45)',
    backgroundColor: 'rgba(77,163,255,0.12)',
  },
  label: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.semibold,
  },
  activeLabel: { color: palette.white },
});

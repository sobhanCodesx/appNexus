import { useMemo, useState } from 'react';
import { StyleSheet, Text, type TextStyle, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontFamily, fontWeight, palette, radii, spacing } from '@/design';

export function ExpandableText({
  text,
  collapsedLines = 4,
  threshold = 190,
  style,
  accent = palette.cyan,
}: {
  text?: string | null;
  collapsedLines?: number;
  threshold?: number;
  style?: TextStyle | TextStyle[];
  accent?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const value = useMemo(() => (text || '').trim(), [text]);
  const canExpand = value.length > threshold || value.split('\n').length > collapsedLines;

  if (!value) return null;

  return (
    <View>
      <Text
        numberOfLines={!expanded && canExpand ? collapsedLines : undefined}
        style={[styles.text, style]}>
        {value}
      </Text>

      {canExpand ? (
        <PressableScale
          haptic
          pressedScale={0.97}
          onPress={() => setExpanded((current) => !current)}
          style={styles.toggle}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={[styles.toggleText, { color: accent }]}>
            {expanded ? 'نمایش کمتر' : 'بیشتر بخوان'}
          </Text>
          <Text style={[styles.chevron, expanded && styles.chevronUp, { borderColor: accent }]} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    color: palette.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 25,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  toggle: {
    alignSelf: 'flex-end',
    minHeight: 36,
    marginTop: spacing.xs,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: palette.line,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },
  toggleText: {
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 9,
  },
  chevron: {
    width: 6,
    height: 6,
    borderRightWidth: 1.3,
    borderBottomWidth: 1.3,
    transform: [{ rotate: '45deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '-135deg' }],
    marginTop: 4,
  },
});

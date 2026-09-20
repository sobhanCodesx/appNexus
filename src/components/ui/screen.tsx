import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { palette } from '@/design';
import { AmbientBackground } from './ambient-background';

type Props = PropsWithChildren<{
  edges?: Edge[];
  ambient?: boolean;
}>;

export function Screen({ children, edges = ['top', 'left', 'right'], ambient = true }: Props) {
  return (
    <View style={styles.root}>
      {ambient ? <AmbientBackground /> : null}
      <SafeAreaView edges={edges} style={styles.safe}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ink,
  },
  safe: {
    flex: 1,
  },
});

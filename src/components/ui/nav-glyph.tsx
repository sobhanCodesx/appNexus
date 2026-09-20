import { StyleSheet, View } from 'react-native';

import { palette } from '@/design';

type Name = 'home' | 'radar' | 'explore' | 'video' | 'profile';

export function NavGlyph({ name, active }: { name: Name; active: boolean }) {
  const color = active ? palette.white : palette.textDim;

  if (name === 'radar') {
    return (
      <View style={[styles.radarOuter, { borderColor: color }]}>
        <View style={[styles.radarInner, { borderColor: color }]} />
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'video') {
    return (
      <View style={[styles.video, { borderColor: color }]}>
        <View style={[styles.play, { borderLeftColor: color }]} />
      </View>
    );
  }

  if (name === 'profile') {
    return (
      <View style={styles.profile}>
        <View style={[styles.head, { borderColor: color }]} />
        <View style={[styles.shoulders, { borderColor: color }]} />
      </View>
    );
  }

  if (name === 'explore') {
    return (
      <View style={[styles.explore, { borderColor: color }]}>
        <View style={[styles.exploreDot, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.home}>
      <View style={[styles.roof, { borderBottomColor: color }]} />
      <View style={[styles.house, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  home: { width: 24, height: 24, alignItems: 'center', justifyContent: 'flex-end' },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomWidth: 9,
    marginBottom: -1,
  },
  house: { width: 17, height: 13, borderWidth: 2, borderRadius: 4 },
  radarOuter: {
    width: 23,
    height: 23,
    borderRadius: 99,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInner: { width: 10, height: 10, borderRadius: 99, borderWidth: 2 },
  dot: { position: 'absolute', width: 4, height: 4, borderRadius: 9, top: 2, right: 5 },
  video: { width: 24, height: 18, borderRadius: 5, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  play: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftWidth: 7,
  },
  profile: { width: 24, height: 24, alignItems: 'center' },
  head: { width: 9, height: 9, borderRadius: 9, borderWidth: 2 },
  shoulders: { width: 20, height: 11, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderWidth: 2, borderBottomWidth: 0, marginTop: 3 },
  explore: { width: 22, height: 22, borderWidth: 2, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  exploreDot: { width: 6, height: 6, borderRadius: 6 },
});

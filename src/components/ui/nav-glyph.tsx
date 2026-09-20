import { StyleSheet, View } from 'react-native';

import { palette, shadow } from '@/design';

type Name = 'home' | 'radar' | 'explore' | 'video' | 'profile';

export function NavGlyph({ name, active }: { name: Name; active: boolean }) {
  const color = active ? palette.white : palette.textDim;

  return (
    <View style={[styles.shell, active && styles.shellActive]}>
      {active ? <View style={styles.aura} /> : null}
      {name === 'radar' ? <Radar color={color} /> : null}
      {name === 'video' ? <Video color={color} /> : null}
      {name === 'profile' ? <Profile color={color} /> : null}
      {name === 'explore' ? <Explore color={color} /> : null}
      {name === 'home' ? <Home color={color} /> : null}
    </View>
  );
}

function Radar({ color }: { color: string }) {
  return (
    <View style={[styles.radarOuter, { borderColor: color }]}>
      <View style={[styles.radarInner, { borderColor: color }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

function Video({ color }: { color: string }) {
  return (
    <View style={[styles.video, { borderColor: color }]}>
      <View style={[styles.play, { borderLeftColor: color }]} />
    </View>
  );
}

function Profile({ color }: { color: string }) {
  return (
    <View style={styles.profile}>
      <View style={[styles.head, { borderColor: color }]} />
      <View style={[styles.shoulders, { borderColor: color }]} />
    </View>
  );
}

function Explore({ color }: { color: string }) {
  return (
    <View style={[styles.explore, { borderColor: color }]}>
      <View style={[styles.exploreDot, { backgroundColor: color }]} />
    </View>
  );
}

function Home({ color }: { color: string }) {
  return (
    <View style={styles.home}>
      <View style={[styles.roof, { borderBottomColor: color }]} />
      <View style={[styles.house, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shellActive: {
    ...shadow.cyanGlow,
  },
  aura: {
    position: 'absolute',
    width: 34,
    height: 27,
    borderRadius: 14,
    backgroundColor: 'rgba(88,244,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.18)',
  },
  home: { width: 22, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomWidth: 8,
    marginBottom: -1,
  },
  house: { width: 16, height: 12, borderWidth: 1.8, borderRadius: 4 },
  radarOuter: {
    width: 21,
    height: 21,
    borderRadius: 99,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInner: { width: 9, height: 9, borderRadius: 99, borderWidth: 1.6 },
  dot: { position: 'absolute', width: 4, height: 4, borderRadius: 9, top: 1, right: 4 },
  video: {
    width: 22,
    height: 17,
    borderRadius: 5,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftWidth: 7,
  },
  profile: { width: 22, height: 22, alignItems: 'center' },
  head: { width: 8, height: 8, borderRadius: 9, borderWidth: 1.8 },
  shoulders: {
    width: 18,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1.8,
    borderBottomWidth: 0,
    marginTop: 3,
  },
  explore: {
    width: 20,
    height: 20,
    borderWidth: 1.8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  exploreDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    transform: [{ rotate: '-45deg' }],
  },
});

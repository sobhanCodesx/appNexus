import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { palette } from '@/design';

/**
 * A premium static backdrop that deliberately avoids full-screen Skia blur masks.
 * It keeps the cinematic PlayNexus look while reducing continuous GPU work on
 * mid-range Android devices and during fast list scrolling.
 */
export function AmbientBackground() {
  const { width, height } = useWindowDimensions();
  const topOrb = Math.max(280, width * 0.82);
  const lowerOrb = Math.max(320, width * 0.92);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[palette.ink, '#06101A', '#04080E', palette.ink]}
        locations={[0, 0.28, 0.68, 1]}
        start={{ x: 0.16, y: 0 }}
        end={{ x: 0.86, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[
          'rgba(24,124,255,0.22)',
          'rgba(88,244,255,0.055)',
          'rgba(24,124,255,0)',
        ]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.12, y: 1 }}
        style={[
          styles.orb,
          {
            width: topOrb,
            height: topOrb,
            borderRadius: topOrb,
            top: -topOrb * 0.52,
            right: -topOrb * 0.42,
          },
        ]}
      />

      <LinearGradient
        colors={[
          'rgba(167,123,255,0.15)',
          'rgba(255,85,213,0.035)',
          'rgba(167,123,255,0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.orb,
          {
            width: lowerOrb,
            height: lowerOrb,
            borderRadius: lowerOrb,
            top: height * 0.40,
            left: -lowerOrb * 0.62,
          },
        ]}
      />

      <View style={[styles.horizon, { top: height * 0.285 }]}>
        <LinearGradient
          colors={[
            'rgba(88,244,255,0)',
            'rgba(88,244,255,0.10)',
            'rgba(88,244,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.gridLine,
              { left: ((index + 1) * width) / 7 },
            ]}
          />
        ))}
      </View>

      <LinearGradient
        colors={[
          'rgba(3,5,9,0)',
          'rgba(3,5,9,0.08)',
          'rgba(3,5,9,0.30)',
        ]}
        locations={[0, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    opacity: 0.88,
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  grid: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.16,
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
});

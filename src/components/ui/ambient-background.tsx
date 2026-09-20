import {
  BlurMask,
  Canvas,
  Circle,
  Fill,
  LinearGradient,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { palette } from '@/design';

export function AmbientBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={[palette.ink, '#07111F', palette.ink]}
          />
        </Fill>

        <Circle cx={width * 0.86} cy={80} r={width * 0.5}>
          <RadialGradient
            c={vec(width * 0.86, 80)}
            r={width * 0.5}
            colors={['rgba(77,163,255,0.25)', 'rgba(77,163,255,0)']}
          />
          <BlurMask blur={24} style="normal" />
        </Circle>

        <Circle cx={width * 0.12} cy={height * 0.52} r={width * 0.54}>
          <RadialGradient
            c={vec(width * 0.12, height * 0.52)}
            r={width * 0.54}
            colors={['rgba(166,107,255,0.16)', 'rgba(166,107,255,0)']}
          />
          <BlurMask blur={28} style="normal" />
        </Circle>
      </Canvas>
    </View>
  );
}

import {
  BlurMask,
  Canvas,
  Circle,
  Fill,
  LinearGradient,
  RadialGradient,
  Rect,
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
            colors={[palette.ink, '#07101B', '#04070C', palette.ink]}
          />
        </Fill>

        <Circle cx={width * 0.92} cy={78} r={width * 0.62}>
          <RadialGradient
            c={vec(width * 0.92, 78)}
            r={width * 0.62}
            colors={[
              'rgba(24,124,255,0.18)',
              'rgba(88,244,255,0.05)',
              'rgba(24,124,255,0)',
            ]}
          />
          <BlurMask blur={34} style="normal" />
        </Circle>

        <Circle cx={width * 0.02} cy={height * 0.58} r={width * 0.60}>
          <RadialGradient
            c={vec(width * 0.02, height * 0.58)}
            r={width * 0.60}
            colors={[
              'rgba(167,123,255,0.11)',
              'rgba(255,85,213,0.025)',
              'rgba(167,123,255,0)',
            ]}
          />
          <BlurMask blur={38} style="normal" />
        </Circle>

        <Rect x={0} y={height * 0.28} width={width} height={1}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, 0)}
            colors={[
              'rgba(88,244,255,0)',
              'rgba(88,244,255,0.055)',
              'rgba(88,244,255,0)',
            ]}
          />
        </Rect>
      </Canvas>
    </View>
  );
}

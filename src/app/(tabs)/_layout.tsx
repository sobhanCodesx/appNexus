import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavGlyph } from '@/components/ui/nav-glyph';
import { fontFamily, fontWeight, layout, palette, radii, shadow } from '@/design';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Never anchor the floating dock to a hardcoded screen edge.
  // Android 3-button navigation, gesture navigation and iOS home indicators
  // all report different bottom safe-area values.
  const dockGap = Platform.OS === 'android' ? 8 : 6;
  const dockBottom = Math.max(
    dockGap,
    insets.bottom + dockGap,
  );
  const dockHeight = layout.tabBarHeight - 4;

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.cyan,
        tabBarInactiveTintColor: palette.textDim,
        tabBarActiveBackgroundColor: 'rgba(88,244,255,0.065)',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: palette.ink },
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: fontFamily.bold,
          fontWeight: fontWeight.bold,
          marginTop: 1,
          letterSpacing: -0.1,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: radii.lg,
          marginVertical: 5,
          marginHorizontal: 2,
          overflow: 'hidden',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: dockBottom,
          height: dockHeight,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.135)',
          borderRadius: 26,
          backgroundColor:
            Platform.OS === 'android'
              ? 'rgba(7,11,18,0.96)'
              : 'transparent',
          paddingTop: 0,
          paddingBottom: 0,
          paddingHorizontal: 4,
          overflow: 'hidden',
          ...shadow.soft,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={92}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.dockGlow} />
            <View style={styles.topHairline} />
          </View>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'خانه',
          tabBarIcon: ({ focused }) => (
            <NavGlyph name="home" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="radar"
        options={{
          title: 'رادار',
          tabBarIcon: ({ focused }) => (
            <NavGlyph name="radar" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'کشف',
          tabBarIcon: ({ focused }) => (
            <NavGlyph name="explore" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'ویدیو',
          tabBarIcon: ({ focused }) => (
            <NavGlyph name="video" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'من',
          tabBarIcon: ({ focused }) => (
            <NavGlyph name="profile" active={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockGlow: {
    position: 'absolute',
    width: 180,
    height: 64,
    borderRadius: 90,
    alignSelf: 'center',
    top: -36,
    backgroundColor: 'rgba(24,124,255,0.08)',
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(88,244,255,0.22)',
  },
});

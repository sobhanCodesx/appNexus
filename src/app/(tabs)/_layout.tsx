import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { NavGlyph } from '@/components/ui/nav-glyph';
import { fontWeight, layout, palette, radii, shadow, typeScale } from '@/design';

export default function TabsLayout() {
  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.white,
        tabBarInactiveTintColor: palette.textDim,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: palette.ink },
        tabBarLabelStyle: {
          fontSize: typeScale.micro,
          fontWeight: fontWeight.bold,
          marginTop: 3,
        },
        tabBarItemStyle: {
          borderRadius: radii.lg,
          marginVertical: 6,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Platform.OS === 'ios' ? 14 : 12,
          height: layout.tabBarHeight + (Platform.OS === 'ios' ? 12 : 0),
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          borderRadius: 28,
          backgroundColor: Platform.OS === 'android' ? 'rgba(7,11,18,0.96)' : 'transparent',
          paddingTop: 2,
          paddingBottom: Platform.OS === 'ios' ? 8 : 2,
          overflow: 'hidden',
          ...shadow.soft,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView intensity={92} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.dockGlow} />
            <View style={styles.topHairline} />
          </View>
        ),
      }}>
      <Tabs.Screen name="index" options={{
        title: 'خانه',
        tabBarIcon: ({ focused }) => <NavGlyph name="home" active={focused} />,
      }} />
      <Tabs.Screen name="radar" options={{
        title: 'رادار',
        tabBarIcon: ({ focused }) => <NavGlyph name="radar" active={focused} />,
      }} />
      <Tabs.Screen name="explore" options={{
        title: 'کشف',
        tabBarIcon: ({ focused }) => <NavGlyph name="explore" active={focused} />,
      }} />
      <Tabs.Screen name="videos" options={{
        title: 'ویدیو',
        tabBarIcon: ({ focused }) => <NavGlyph name="video" active={focused} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'من',
        tabBarIcon: ({ focused }) => <NavGlyph name="profile" active={focused} />,
      }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockGlow: {
    position: 'absolute',
    width: 180,
    height: 80,
    borderRadius: 90,
    alignSelf: 'center',
    top: -42,
    backgroundColor: 'rgba(24,124,255,0.08)',
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: 'rgba(88,244,255,0.16)',
  },
});

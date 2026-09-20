import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { NavGlyph } from '@/components/ui/nav-glyph';
import { fontWeight, layout, palette, typeScale } from '@/design';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.white,
        tabBarInactiveTintColor: palette.textDim,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: palette.ink },
        tabBarLabelStyle: {
          fontSize: typeScale.micro,
          fontWeight: fontWeight.bold,
          marginTop: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          height: layout.tabBarHeight + (Platform.OS === 'ios' ? 14 : 8),
          borderTopWidth: 1,
          borderTopColor: palette.line,
          backgroundColor: Platform.OS === 'android' ? 'rgba(5,7,11,0.96)' : 'transparent',
          paddingTop: 7,
        },
        tabBarBackground: () => (
          <BlurView intensity={78} tint="dark" style={StyleSheet.absoluteFill} />
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

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontFamily, fontWeight, palette, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';

export type StorefrontStory = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  media_type?: 'image' | 'video' | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  link_url?: string | null;
  link_label?: string | null;
  channel_name?: string | null;
  channel_avatar_url?: string | null;
};

const fallback = require('../../../assets/images/logo-glow.png');
const sessionSeenStories = new Set<number>();

function thumbnailOf(story: StorefrontStory) {
  if (story.thumbnail_url) return story.thumbnail_url;
  if (story.media_type === 'image') return story.media_url;
  return story.channel_avatar_url;
}

export function StoryTray() {
  const stories = usePaginatedResource<StorefrontStory>('/stories?per_page=20', 45_000);
  const [, bumpSeen] = useState(0);
  const items = (stories.data.data || []).slice(0, 20);

  if (!items.length && !stories.loading) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}>
        {stories.loading && !items.length
          ? Array.from({ length: 7 }).map((_, index) => (
              <View key={index} style={styles.item}>
                <View style={styles.skeletonRing}>
                  <View style={styles.skeletonAvatar} />
                </View>
                <View style={styles.skeletonLabel} />
              </View>
            ))
          : items.map((story) => {
              const seen = sessionSeenStories.has(story.id);
              const thumbnail = thumbnailOf(story);

              const media = (
                <View style={styles.ringInner}>
                  <Image
                    source={thumbnail ? { uri: String(thumbnail) } : fallback}
                    style={styles.avatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </View>
              );

              return (
                <PressableScale
                  key={story.id}
                  haptic
                  pressedScale={0.96}
                  onPress={() => {
                    sessionSeenStories.add(story.id);
                    bumpSeen((value) => value + 1);
                    router.push({
                      pathname: '/stories',
                      params: { start: story.slug },
                    });
                  }}
                  style={styles.item}>
                  {seen ? (
                    <View style={styles.seenRing}>
                      {media}
                    </View>
                  ) : (
                    <LinearGradient
                      colors={[palette.warning, palette.magenta, palette.violet]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ring}>
                      {media}
                    </LinearGradient>
                  )}

                  {!seen ? (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>جدید</Text>
                    </View>
                  ) : null}

                  <Text
                    numberOfLines={1}
                    style={[styles.label, seen && styles.labelSeen]}>
                    {story.title}
                  </Text>
                </PressableScale>
              );
            })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.055)',
  },
  rail: {
    paddingHorizontal: 12,
    paddingTop: 5,
    paddingBottom: 3,
    gap: 10,
  },
  item: {
    width: 68,
    alignItems: 'center',
  },
  ring: {
    width: 62,
    height: 62,
    borderRadius: 62,
    padding: 2.5,
  },
  seenRing: {
    width: 62,
    height: 62,
    borderRadius: 62,
    padding: 2.5,
    backgroundColor: 'rgba(100,116,139,0.72)',
  },
  ringInner: {
    flex: 1,
    borderRadius: 60,
    padding: 2.3,
    backgroundColor: palette.ink,
  },
  avatar: {
    flex: 1,
    borderRadius: 56,
    backgroundColor: palette.surface,
  },
  newBadge: {
    position: 'absolute',
    top: 48,
    minWidth: 28,
    height: 14,
    paddingHorizontal: 4,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: palette.ink,
    backgroundColor: palette.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 6,
    lineHeight: 8,
  },
  label: {
    width: 66,
    marginTop: 7,
    color: palette.text,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
  },
  labelSeen: {
    color: palette.textMuted,
  },
  skeletonRing: {
    width: 62,
    height: 62,
    borderRadius: 62,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skeletonAvatar: {
    flex: 1,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonLabel: {
    width: 44,
    height: 7,
    borderRadius: 7,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
});

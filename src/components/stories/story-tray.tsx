import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { fontFamily, fontWeight, palette, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import { PressableScale } from '@/components/ui/pressable-scale';

type StoryItem = {
  id: number;
  type: 'story';
  title: string;
  slug: string;
  excerpt?: string | null;
  media_type?: 'image' | 'video' | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  link_url?: string | null;
  link_label?: string | null;
  published_at?: string | null;
  author?: { name?: string | null; avatar_url?: string | null } | null;
  game?: {
    id: number;
    name: string;
    slug: string;
    cover_url?: string | null;
    logo_url?: string | null;
  } | null;
};
type StoryBubble = {
  key: string;
  slug: string;
  name: string;
  avatar?: string | null;
};

const fallback = require('../../../assets/images/logo-glow.png');
const sessionSeenStories = new Set<string>();

function slugOf(item: StoryItem) {
  return item.slug;
}

function mediaOf(item: StoryItem) {
  return item.thumbnail_url
    || item.media_url
    || item.game?.cover_url
    || item.game?.logo_url;
}

function identityOf(item: StoryItem) {
  const gameKey = item.game?.slug || item.game?.id;
  if (gameKey) return 'game-' + gameKey;

  return 'author-' + (item.author?.name || item.id);
}

function avatarOf(item: StoryItem) {
  return item.author?.avatar_url
    || item.game?.logo_url
    || item.game?.cover_url
    || mediaOf(item);
}

function nameOf(item: StoryItem) {
  return item.author?.name
    || item.game?.name
    || 'PlayNexus';
}

export function StoryTray() {
  const stories = usePaginatedResource<StoryItem>('/stories?per_page=18', 45_000);
  const [, setSeenVersion] = useState(0);

  const bubbles = useMemo<StoryBubble[]>(() => {
    const seen = new Set<string>();

    return (stories.data.data || []).reduce<StoryBubble[]>((result, item) => {
      const key = identityOf(item);
      if (seen.has(key)) return result;

      seen.add(key);
      result.push({
        key,
        slug: slugOf(item),
        name: nameOf(item),
        avatar: avatarOf(item),
      });

      return result;
    }, []).slice(0, 12);
  }, [stories.data.data]);

  if (!bubbles.length && !stories.loading) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}>
        {stories.loading && !bubbles.length
          ? Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.bubble}>
                <View style={styles.skeletonRing}>
                  <View style={styles.skeletonAvatar} />
                </View>
                <View style={styles.skeletonLabel} />
              </View>
            ))
          : bubbles.map((story) => {
              const seen = sessionSeenStories.has(story.key);
              const avatar = (
                <View style={styles.ringInner}>
                  <Image
                    source={story.avatar ? { uri: String(story.avatar) } : fallback}
                    style={styles.avatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </View>
              );

              return (
                <PressableScale
                  key={story.key}
                  haptic
                  pressedScale={0.96}
                  onPress={() => {
                    sessionSeenStories.add(story.key);
                    setSeenVersion((value) => value + 1);
                    router.push({
                      pathname: '/stories',
                      params: { start: story.slug },
                    });
                  }}
                  style={styles.bubble}>
                  {seen ? (
                    <View style={styles.seenRing}>{avatar}</View>
                  ) : (
                    <LinearGradient
                      colors={[palette.warning, palette.magenta, palette.violet]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ring}>
                      {avatar}
                    </LinearGradient>
                  )}
                  <Text numberOfLines={1} style={[styles.label, seen && styles.labelSeen]}>{story.name}</Text>
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
  },
  rail: {
    paddingHorizontal: 12,
    gap: 10,
  },
  bubble: {
    width: 72,
    alignItems: 'center',
  },
  ring: {
    width: 66,
    height: 66,
    borderRadius: 66,
    padding: 2.2,
  },
  seenRing: {
    width: 66,
    height: 66,
    borderRadius: 66,
    padding: 2.2,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  ringInner: {
    flex: 1,
    borderRadius: 64,
    padding: 2.2,
    backgroundColor: palette.ink,
  },
  avatar: {
    flex: 1,
    borderRadius: 60,
    backgroundColor: palette.surface,
  },
  label: {
    width: 70,
    marginTop: 5,
    color: palette.text,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
  },
  labelSeen: {
    color: palette.textMuted,
  },
  skeletonRing: {
    width: 66,
    height: 66,
    borderRadius: 66,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skeletonAvatar: {
    flex: 1,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonLabel: {
    width: 45,
    height: 7,
    borderRadius: 7,
    marginTop: 7,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
});

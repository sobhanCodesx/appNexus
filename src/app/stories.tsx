import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, palette, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import type { ContentCard } from '@/types/api';

type StoryItem = ContentCard & {
  body?: string | null;
  feed_slug?: string | null;
  media?: { type?: string | null; url?: string | null; thumbnail?: string | null }[];
  author?: { name?: string | null; avatar_url?: string | null };
};

const fallback = require('../../assets/images/logo-glow.png');
const STORY_DURATION = 6200;

function slugOf(item: StoryItem) {
  return item.slug || item.feed_slug || String(item.id);
}

function imageOf(item: StoryItem) {
  const media = item.media?.[0];
  return item.thumbnail_url
    || media?.thumbnail
    || (media?.type === 'image' ? media.url : null)
    || item.image_url
    || item.cover_url
    || item.game?.cover_url
    || item.channel?.cover_url
    || item.channel?.logo_url
    || item.channel?.avatar_url;
}

function avatarOf(item: StoryItem) {
  return item.author?.avatar_url
    || item.channel?.logo_url
    || item.channel?.avatar_url
    || item.channel?.cover_url
    || item.game?.cover_url
    || imageOf(item);
}

function authorOf(item: StoryItem) {
  return item.author?.name
    || item.channel?.name
    || item.game?.name
    || 'PlayNexus';
}

export default function StoriesScreen() {
  const params = useLocalSearchParams<{ start?: string }>();
  const start = Array.isArray(params.start) ? params.start[0] : params.start;
  const stories = usePaginatedResource<StoryItem>('/feed?tab=for-you&per_page=24', 45_000);
  const items = useMemo(
    () => (stories.data.data || []).filter((item) => Boolean(imageOf(item))),
    [stories.data.data],
  );

  const [active, setActive] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const remaining = useRef(STORY_DURATION);

  useEffect(() => {
    if (!items.length || !start) return;
    const index = items.findIndex((item) => slugOf(item) === start);
    if (index >= 0) setActive(index);
  }, [items, start]);

  const next = useCallback(() => {
    if (!items.length) return;

    setActive((current) => {
      if (current >= items.length - 1) {
        requestAnimationFrame(() => router.back());
        return current;
      }
      return current + 1;
    });
  }, [items.length]);

  const previous = useCallback(() => {
    setActive((current) => Math.max(0, current - 1));
  }, []);

  const startProgress = useCallback((duration: number) => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) next();
    });
  }, [next, progress]);

  useEffect(() => {
    if (!items.length) return;

    progress.stopAnimation();
    progress.setValue(0);
    remaining.current = STORY_DURATION;
    startProgress(STORY_DURATION);

    return () => {
      progress.stopAnimation();
    };
  }, [active, items.length, progress, startProgress]);

  const pause = useCallback(() => {
    progress.stopAnimation((value) => {
      remaining.current = Math.max(120, Math.round(STORY_DURATION * (1 - value)));
    });
  }, [progress]);

  const resume = useCallback(() => {
    startProgress(remaining.current);
  }, [startProgress]);

  if (stories.loading && !items.length) {
    return (
      <Screen edges={['left', 'right']} ambient={false}>
        <View style={styles.loading}>
          <SkeletonBox style={StyleSheet.absoluteFill} radius={0} />
          <View style={styles.loadingBars}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={styles.loadingBar} />
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  const item = items[active];
  if (!item) return null;

  const image = imageOf(item);
  const avatar = avatarOf(item);
  const caption = item.excerpt || item.body || '';
  const activeWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Screen edges={['left', 'right']} ambient={false}>
      <View style={styles.root}>
        <Image
          source={image ? { uri: String(image) } : fallback}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={100}
        />

        <LinearGradient
          colors={[
            'rgba(0,0,0,0.48)',
            'rgba(0,0,0,0.04)',
            'rgba(0,0,0,0.02)',
            'rgba(0,0,0,0.62)',
          ]}
          locations={[0, 0.22, 0.68, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.progressRow}>
          {items.map((story, index) => (
            <View key={story.id} style={styles.progressTrack}>
              {index < active ? <View style={styles.progressComplete} /> : null}
              {index === active ? (
                <Animated.View style={[styles.progressActive, { width: activeWidth }]} />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <View style={styles.authorRow}>
            <View style={styles.avatarRing}>
              <Image
                source={avatar ? { uri: String(avatar) } : fallback}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>
            <View style={styles.authorCopy}>
              <Text numberOfLines={1} style={styles.author}>{authorOf(item)}</Text>
              <Text style={styles.time}>الان</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <PressableScale
              haptic={false}
              pressedScale={0.94}
              onPress={() => router.back()}
              style={styles.iconButton}>
              <Text style={styles.close}>×</Text>
            </PressableScale>
          </View>
        </View>

        <Pressable
          onPressIn={pause}
          onPressOut={resume}
          onPress={previous}
          style={styles.leftTap}
          accessibilityLabel="استوری قبلی"
        />
        <Pressable
          onPressIn={pause}
          onPressOut={resume}
          onPress={next}
          style={styles.rightTap}
          accessibilityLabel="استوری بعدی"
        />

        <View pointerEvents="none" style={styles.bottom}>
          <Text numberOfLines={2} style={styles.caption}>
            {caption || item.title}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.black,
  },
  progressRow: {
    position: 'absolute',
    zIndex: 20,
    top: 48,
    left: 8,
    right: 8,
    height: 3,
    flexDirection: 'row',
    gap: 3,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.34)',
    overflow: 'hidden',
  },
  progressComplete: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: palette.white,
  },
  progressActive: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: palette.white,
    borderRadius: 3,
  },
  header: {
    position: 'absolute',
    zIndex: 20,
    top: 58,
    left: 12,
    right: 12,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 38,
    padding: 1.5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.70)',
    backgroundColor: 'rgba(0,0,0,0.20)',
  },
  avatar: {
    flex: 1,
    borderRadius: 36,
  },
  authorCopy: {
    flex: 1,
    alignItems: 'flex-start',
  },
  author: {
    maxWidth: 190,
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: 12,
  },
  time: {
    color: 'rgba(255,255,255,0.70)',
    fontFamily: fontFamily.regular,
    fontSize: 9,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    color: palette.white,
    fontSize: 30,
    lineHeight: 32,
    fontFamily: fontFamily.regular,
  },
  leftTap: {
    position: 'absolute',
    zIndex: 10,
    top: 115,
    left: 0,
    bottom: 115,
    width: '38%',
  },
  rightTap: {
    position: 'absolute',
    zIndex: 10,
    top: 115,
    right: 0,
    bottom: 115,
    width: '62%',
  },
  bottom: {
    position: 'absolute',
    zIndex: 20,
    left: 14,
    right: 14,
    bottom: 28,
    alignItems: 'center',
  },
  caption: {
    maxWidth: 330,
    color: palette.white,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
    marginBottom: spacing.sm,
  },
  loading: {
    flex: 1,
    backgroundColor: palette.black,
  },
  loadingBars: {
    position: 'absolute',
    top: 48,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 3,
  },
  loadingBar: {
    flex: 1,
    height: 2.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});

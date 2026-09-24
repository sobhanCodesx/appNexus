import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { StorefrontStory } from '@/components/stories/story-tray';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { SkeletonBox } from '@/components/ui/skeleton';
import { fontFamily, fontWeight, palette, spacing } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';

const fallback = require('../../assets/images/logo-glow.png');
const IMAGE_DURATION = 5000;
const PLAYNEXUS_ORIGIN = 'https://playnexus.ir';

function decodeSlug(value?: string) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function nativeStoryTarget(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (!/(^|\.)playnexus\.ir$/i.test(parsed.hostname)) return null;
      pathname = parsed.pathname;
    } catch {
      return null;
    }
  }

  if (!pathname.startsWith('/')) return null;

  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const parts = clean.split('/').filter(Boolean);
  const section = parts[0]?.toLowerCase();
  const slug = decodeSlug(parts[1]);

  if (slug && ['videos', 'video', 'posts', 'post', 'shorts', 'short'].includes(section || '')) {
    return { pathname: '/content/[slug]' as const, params: { slug } };
  }

  if (slug && ['games', 'game', 'channels', 'channel'].includes(section || '')) {
    return { pathname: '/channel/[slug]' as const, params: { slug } };
  }

  if (slug && ['studios', 'studio'].includes(section || '')) {
    return { pathname: '/studio/[slug]' as const, params: { slug } };
  }

  if (slug && ['collections', 'collection'].includes(section || '')) {
    return { pathname: '/collection/[slug]' as const, params: { slug } };
  }

  if (slug && ['products', 'product'].includes(section || '')) {
    return { pathname: '/product/[slug]' as const, params: { slug } };
  }

  if (clean === '/feed' || clean.startsWith('/feed/')) return '/feed' as const;
  if (clean === '/game-radar' || clean === '/radar') return '/(tabs)/radar' as const;
  if (clean === '/videos') return '/(tabs)/videos' as const;
  if (clean === '/explore') return '/(tabs)/explore' as const;
  if (clean === '/store') return '/store' as const;

  return null;
}

async function openStoryLink(rawUrl: string) {
  const target = nativeStoryTarget(rawUrl);
  if (target) {
    router.push(target);
    return;
  }

  const trimmed = rawUrl.trim();
  const externalUrl = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.startsWith('/')
      ? PLAYNEXUS_ORIGIN + trimmed
      : 'https://' + trimmed;

  try {
    await Linking.openURL(externalUrl);
  } catch {
    if (externalUrl !== PLAYNEXUS_ORIGIN) {
      await Linking.openURL(PLAYNEXUS_ORIGIN);
    }
  }
}

export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ start?: string }>();
  const start = Array.isArray(params.start) ? params.start[0] : params.start;
  const stories = usePaginatedResource<StorefrontStory>('/stories?per_page=24', 45_000);
  const items = useMemo(
    () => (stories.data.data || []).filter((item) => Boolean(item.media_url)),
    [stories.data.data],
  );

  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!items.length || !start) return;
    const index = items.findIndex((item) => item.slug === start);
    if (index >= 0) {
      const frame = requestAnimationFrame(() => {
        setProgress(0);
        setActive(index);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [items, start]);

  const goTo = useCallback((index: number) => {
    if (!items.length) return;
    if (index < 0) {
      setProgress(0);
      setActive(0);
      return;
    }
    if (index >= items.length) {
      router.back();
      return;
    }

    setProgress(0);
    setManualPaused(false);
    setHolding(false);
    setActive(index);
  }, [items.length]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const previous = useCallback(() => goTo(active - 1), [active, goTo]);

  const item = items[active];
  const paused = manualPaused || holding;

  useEffect(() => {
    if (!item || item.media_type === 'video' || paused) return;

    const startedAt = Date.now() - progress * IMAGE_DURATION;
    const timer = setInterval(() => {
      const value = Math.min(1, (Date.now() - startedAt) / IMAGE_DURATION);
      setProgress(value);
      if (value >= 1) next();
    }, 50);

    return () => clearInterval(timer);
  }, [active, item, next, paused]);

  if (stories.loading && !items.length) {
    return (
      <Screen edges={['left', 'right']} ambient={false}>
        <View style={styles.loading}>
          <SkeletonBox style={StyleSheet.absoluteFill} radius={0} />
          <View style={styles.loadingBars}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View key={index} style={styles.loadingBar} />
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  if (!item) return null;

  return (
    <Screen edges={['left', 'right']} ambient={false}>
      <View style={styles.root}>
        <StoryMedia
          key={item.id}
          story={item}
          paused={paused}
          muted={muted}
          onProgress={setProgress}
          onEnded={next}
        />

        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(0,0,0,0.78)',
            'rgba(0,0,0,0.08)',
            'rgba(0,0,0,0.02)',
            'rgba(0,0,0,0.68)',
          ]}
          locations={[0, 0.24, 0.67, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.progressRow}>
          {items.map((story, index) => (
            <View key={story.id} style={styles.progressTrack}>
              {index < active ? <View style={styles.progressComplete} /> : null}
              {index === active ? (
                <View style={[styles.progressActive, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <View style={styles.identity}>
            <Image
              source={item.channel_avatar_url ? { uri: item.channel_avatar_url } : fallback}
              style={styles.channelAvatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={styles.identityCopy}>
              <Text numberOfLines={1} style={styles.channelName}>
                {item.channel_name || 'PlayNexus'}
              </Text>
              <Text numberOfLines={1} style={styles.storyTitle}>{item.title}</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <PressableScale
              haptic={false}
              onPress={() => setManualPaused((value) => !value)}
              style={styles.iconButton}>
              <Text style={styles.controlGlyph}>{paused ? '▶' : 'Ⅱ'}</Text>
            </PressableScale>

            {item.media_type === 'video' ? (
              <PressableScale
                haptic={false}
                onPress={() => setMuted((value) => !value)}
                style={styles.iconButton}>
                <Text style={styles.controlGlyph}>{muted ? '×♪' : '♪'}</Text>
              </PressableScale>
            ) : null}

            <PressableScale
              haptic={false}
              onPress={() => router.back()}
              style={styles.iconButton}>
              <Text style={styles.close}>×</Text>
            </PressableScale>
          </View>
        </View>

        <Pressable
          onPressIn={() => setHolding(true)}
          onPressOut={() => setHolding(false)}
          onPress={next}
          style={styles.nextTap}
          accessibilityLabel="استوری بعدی"
        />
        <Pressable
          onPressIn={() => setHolding(true)}
          onPressOut={() => setHolding(false)}
          onPress={previous}
          style={styles.previousTap}
          accessibilityLabel="استوری قبلی"
        />

        <Text pointerEvents="none" style={styles.rightChevron}>›</Text>
        <Text pointerEvents="none" style={styles.leftChevron}>‹</Text>

        <View
          pointerEvents="box-none"
          style={[
            styles.bottom,
            { bottom: Math.max(insets.bottom, 14) + 16 },
          ]}>
          {item.excerpt ? (
            <View style={styles.captionBox}>
              <Text style={styles.caption}>{item.excerpt}</Text>
            </View>
          ) : null}

          {item.link_url ? (
            <PressableScale
              haptic
              onPress={() => {
                if (item.link_url) void openStoryLink(item.link_url);
              }}
              style={styles.linkButton}>
              <Text style={styles.linkArrow}>↖</Text>
              <Text style={styles.linkText}>
                {item.link_label?.trim() || 'مشاهده لینک'}
              </Text>
            </PressableScale>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function StoryMedia({
  story,
  paused,
  muted,
  onProgress,
  onEnded,
}: {
  story: StorefrontStory;
  paused: boolean;
  muted: boolean;
  onProgress: (value: number) => void;
  onEnded: () => void;
}) {
  if (story.media_type !== 'video') {
    return (
      <Image
        source={story.media_url ? { uri: story.media_url } : fallback}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={100}
      />
    );
  }

  return (
    <StoryVideo
      source={String(story.media_url || '')}
      paused={paused}
      muted={muted}
      onProgress={onProgress}
      onEnded={onEnded}
    />
  );
}

function StoryVideo({
  source,
  paused,
  muted,
  onProgress,
  onEnded,
}: {
  source: string;
  paused: boolean;
  muted: boolean;
  onProgress: (value: number) => void;
  onEnded: () => void;
}) {
  const player = useVideoPlayer({ uri: source }, (instance) => {
    instance.timeUpdateEventInterval = 0.08;
    instance.muted = muted;
    instance.play();
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    player.muted = muted;
  }, [muted, player]);

  useFocusEffect(
    useCallback(() => {
      if (paused) {
        player.pause();
      } else {
        player.play();
      }

      return () => {
        player.pause();
      };
    }, [paused, player]),
  );

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration || 0;
    onProgress(duration > 0 ? Math.min(1, currentTime / duration) : 0);
  });

  useEventListener(player, 'playToEnd', () => {
    onProgress(1);
    onEnded();
  });

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.black,
  },
  progressRow: {
    position: 'absolute',
    zIndex: 30,
    top: 46,
    left: 8,
    right: 8,
    height: 4,
    flexDirection: 'row',
    gap: 3,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.30)',
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
    height: 3,
    borderRadius: 4,
    backgroundColor: palette.white,
  },
  header: {
    position: 'absolute',
    zIndex: 30,
    top: 56,
    left: 10,
    right: 10,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelAvatar: {
    width: 36,
    height: 36,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  identityCopy: {
    maxWidth: 190,
    alignItems: 'flex-start',
  },
  channelName: {
    color: palette.white,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: 12,
  },
  storyTitle: {
    maxWidth: 185,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: fontFamily.regular,
    fontSize: 9,
    marginTop: 1,
  },
  headerActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlGlyph: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 15,
  },
  close: {
    color: palette.white,
    fontFamily: fontFamily.regular,
    fontSize: 29,
    lineHeight: 30,
  },
  nextTap: {
    position: 'absolute',
    zIndex: 20,
    top: 112,
    right: 0,
    bottom: 100,
    width: '34%',
  },
  previousTap: {
    position: 'absolute',
    zIndex: 20,
    top: 112,
    left: 0,
    bottom: 100,
    width: '34%',
  },
  rightChevron: {
    position: 'absolute',
    zIndex: 21,
    right: 11,
    top: '49%',
    color: 'rgba(255,255,255,0.68)',
    fontSize: 38,
    lineHeight: 40,
  },
  leftChevron: {
    position: 'absolute',
    zIndex: 21,
    left: 11,
    top: '49%',
    color: 'rgba(255,255,255,0.68)',
    fontSize: 38,
    lineHeight: 40,
  },
  bottom: {
    position: 'absolute',
    zIndex: 30,
    left: 18,
    right: 18,
    gap: spacing.sm,
  },
  captionBox: {
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.44)',
  },
  caption: {
    color: palette.white,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
    fontSize: 12,
    lineHeight: 21,
    textAlign: 'right',
  },
  linkButton: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  linkArrow: {
    color: palette.ink,
    fontFamily: fontFamily.black,
    fontSize: 15,
  },
  linkText: {
    color: palette.ink,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 11,
  },
  loading: {
    flex: 1,
    backgroundColor: palette.black,
  },
  loadingBars: {
    position: 'absolute',
    top: 46,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 3,
  },
  loadingBar: {
    flex: 1,
    height: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});

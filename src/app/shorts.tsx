import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import {
  fontWeight,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, apiRequest } from '@/services/api';
import type { ContentCard, Paginated } from '@/types/api';

export default function ShortsScreen() {
  const { height } = useWindowDimensions();
  const { data, refreshing, refresh } = useApiResource<Paginated<ContentCard>>(
    '/shorts',
    { data: [] },
    15_000,
  );
  const [activeId, setActiveId] = useState<number | null>(null);

  const effectiveActiveId = activeId ?? data.data?.[0]?.id ?? null;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const next = viewableItems.find((item) => item.isViewable)?.item as ContentCard | undefined;
      if (next) setActiveId(next.id);
    },
    [],
  );

  return (
    <View style={styles.root}>
      <FlashList
        data={data.data || []}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refresh}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 72 }}
        renderItem={({ item, index }) => (
          <ShortItem
            item={item}
            active={item.id === effectiveActiveId}
            height={height}
            index={index}
            total={data.data?.length || 0}
          />
        )}
      />

      <View pointerEvents="box-none" style={styles.topBar}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>

        <View style={styles.topCopy}>
          <View style={styles.topSignalRow}>
            <View style={styles.topSignalDot} />
            <Text style={styles.topKicker}>VERTICAL GAMING MODE</Text>
          </View>
          <Text style={styles.topTitle}>Shorts</Text>
        </View>
      </View>
    </View>
  );
}

function ShortItem({
  item,
  active,
  height,
  index,
  total,
}: {
  item: ContentCard;
  active: boolean;
  height: number;
  index: number;
  total: number;
}) {
  const player = useVideoPlayer(
    item.video_url ? { uri: item.video_url } : null,
    (instance) => {
      instance.loop = true;
      instance.muted = false;
    },
  );

  const [liked, setLiked] = useState(Boolean(item.is_liked));
  const [saved, setSaved] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);

  useEffect(() => {
    if (!item.video_url) return;

    if (active && !manualPaused) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, item.video_url, manualPaused, player]);

  useEffect(() => {
    if (!active) setManualPaused(false);
  }, [active]);

  const requireAuth = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      router.push('/auth/login');
      return true;
    }
    return false;
  };

  const toggleLike = async () => {
    try {
      const response = await apiRequest<{ reaction: 'like' | null }>(
        '/contents/' + encodeURIComponent(item.slug) + '/reaction',
        { method: 'POST', body: JSON.stringify({ type: 'like' }) },
      );
      setLiked(response.reaction === 'like');
      void Haptics.selectionAsync();
    } catch (error) {
      requireAuth(error);
    }
  };

  const toggleSave = async () => {
    try {
      const response = await apiRequest<{ saved: boolean }>(
        '/contents/' + encodeURIComponent(item.slug) + '/save',
        { method: 'POST' },
      );
      setSaved(response.saved);
      void Haptics.selectionAsync();
    } catch (error) {
      requireAuth(error);
    }
  };

  const togglePlayback = () => {
    setManualPaused((current) => !current);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.short, { height }]}>
      {item.video_url ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <View style={styles.missingVideo}>
          <Text style={styles.missingText}>ویدیو در دسترس نیست</Text>
        </View>
      )}

      <LinearGradient
        colors={[
          'rgba(0,0,0,0.20)',
          'rgba(0,0,0,0.00)',
          'rgba(0,0,0,0.04)',
          'rgba(0,0,0,0.84)',
        ]}
        locations={[0, 0.22, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        accessibilityRole="button"
        onPress={togglePlayback}
        style={styles.playbackTap}>
        {manualPaused ? (
          <View style={styles.pauseFeedback}>
            <Text style={styles.pauseSymbol}>Ⅱ</Text>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.progressMeta}>
        <Text style={styles.progressText}>
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: total ? ((index + 1) / total) * 100 + '%' : '0%' },
            ]}
          />
        </View>
      </View>

      <View style={styles.sideActions}>
        <ShortAction
          symbol={liked ? '♥' : '♡'}
          label={(item.likes_count || 0).toLocaleString('fa-IR')}
          active={liked}
          onPress={() => void toggleLike()}
        />
        <ShortAction
          symbol="◌"
          label={(item.comments_count || 0).toLocaleString('fa-IR')}
          onPress={() => router.push({
            pathname: '/content/[slug]',
            params: { slug: item.slug },
          })}
        />
        <ShortAction
          symbol={saved ? '◆' : '◇'}
          label={saved ? 'ذخیره' : 'Save'}
          active={saved}
          onPress={() => void toggleSave()}
        />
      </View>

      <View style={styles.bottomCopy}>
        <View style={styles.channelRow}>
          {item.channel?.avatar_url ? (
            <Image
              source={{ uri: item.channel.avatar_url }}
              style={styles.channelAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.channelFallback}>
              <View style={styles.channelFallbackCore} />
            </View>
          )}

          <View style={styles.channelCopy}>
            <Text style={styles.channelName}>
              {item.channel?.name || item.game?.name || 'PlayNexus'}
            </Text>
            <Text style={styles.channelMeta}>PLAYNEXUS SHORT</Text>
          </View>
        </View>

        <Text numberOfLines={3} style={styles.shortTitle}>{item.title}</Text>

        {item.excerpt ? (
          <Text numberOfLines={2} style={styles.excerpt}>{item.excerpt}</Text>
        ) : null}

        <PressableScale
          onPress={() => router.push({
            pathname: '/content/[slug]',
            params: { slug: item.slug },
          })}
          style={styles.openContent}>
          <Text style={styles.openContentText}>جزئیات و گفتگو</Text>
          <View style={styles.openContentArrow} />
        </PressableScale>
      </View>
    </View>
  );
}

function ShortAction({
  symbol,
  label,
  active = false,
  onPress,
}: {
  symbol: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} pressedScale={0.93} style={styles.action}>
      <View style={[styles.actionIcon, active && styles.actionIconActive]}>
        <Text style={[styles.actionSymbol, active && styles.actionSymbolActive]}>
          {symbol}
        </Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.black,
  },
  short: {
    width: '100%',
    backgroundColor: palette.black,
  },
  missingVideo: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: {
    color: palette.textMuted,
  },
  playbackTap: {
    position: 'absolute',
    top: 112,
    bottom: 170,
    left: 0,
    right: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseFeedback: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'rgba(3,5,9,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  pauseSymbol: {
    color: palette.white,
    fontSize: 25,
    fontWeight: fontWeight.black,
    letterSpacing: 3,
  },
  topBar: {
    position: 'absolute',
    top: 54,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: 'rgba(3,5,9,0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backText: {
    color: palette.white,
    fontSize: 26,
    fontWeight: fontWeight.bold,
  },
  topCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  topSignalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  topSignalDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.magenta,
  },
  topKicker: {
    color: palette.textMuted,
    fontSize: 8,
    letterSpacing: 1.1,
    fontWeight: fontWeight.black,
  },
  topTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 2,
  },
  progressMeta: {
    position: 'absolute',
    top: 112,
    right: 18,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.7,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.cyan,
  },
  sideActions: {
    position: 'absolute',
    right: 14,
    bottom: 116,
    gap: spacing.lg,
  },
  action: {
    alignItems: 'center',
    gap: 5,
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: 'rgba(3,5,9,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  actionIconActive: {
    borderColor: 'rgba(88,244,255,0.42)',
    backgroundColor: 'rgba(88,244,255,0.12)',
    ...shadow.cyanGlow,
  },
  actionSymbol: {
    color: palette.white,
    fontSize: 23,
  },
  actionSymbolActive: {
    color: palette.cyan,
  },
  actionLabel: {
    color: palette.white,
    fontSize: 9,
    fontWeight: fontWeight.black,
  },
  bottomCopy: {
    position: 'absolute',
    left: 18,
    right: 84,
    bottom: 34,
    alignItems: 'flex-end',
  },
  channelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  channelAvatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)',
  },
  channelFallback: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(24,124,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelFallbackCore: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  channelCopy: {
    alignItems: 'flex-end',
  },
  channelName: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  channelMeta: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.9,
    marginTop: 2,
  },
  shortTitle: {
    color: palette.white,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    letterSpacing: -0.4,
  },
  excerpt: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: typeScale.bodySm,
    lineHeight: 21,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  openContent: {
    marginTop: spacing.md,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  openContentText: {
    color: palette.white,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
  },
  openContentArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.3,
    borderBottomWidth: 1.3,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
});

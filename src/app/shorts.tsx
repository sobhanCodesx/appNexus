import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, spacing, typeScale } from '@/design';
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

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const next = viewableItems.find((item) => item.isViewable)?.item as ContentCard | undefined;
      if (next) setActiveId(next.id);
    },
  ).current;

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
        renderItem={({ item }) => (
          <ShortItem
            item={item}
            active={item.id === effectiveActiveId}
            height={height}
          />
        )}
      />

      <View pointerEvents="box-none" style={styles.topBar}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>
        <View style={styles.topCopy}>
          <Text style={styles.topKicker}>PLAYNEXUS</Text>
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
}: {
  item: ContentCard;
  active: boolean;
  height: number;
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

  useEffect(() => {
    if (!item.video_url) return;

    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, item.video_url, player]);

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

      <View style={styles.scrim} />

      <View style={styles.sideActions}>
        <ShortAction
          symbol={liked ? '♥' : '♡'}
          label={(item.likes_count || 0).toLocaleString('fa-IR')}
          active={liked}
          onPress={() => void toggleLike()}
        />
        <ShortAction
          symbol="☰"
          label={(item.comments_count || 0).toLocaleString('fa-IR')}
          onPress={() => router.push({ pathname: '/content/[slug]', params: { slug: item.slug } })}
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
          <View style={styles.channelDot} />
          <Text style={styles.channelName}>{item.channel?.name || item.game?.name || 'PlayNexus'}</Text>
        </View>
        <Text numberOfLines={2} style={styles.shortTitle}>{item.title}</Text>
        {item.excerpt ? <Text numberOfLines={2} style={styles.excerpt}>{item.excerpt}</Text> : null}
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
    <PressableScale onPress={onPress} style={styles.action}>
      <View style={[styles.actionIcon, active && styles.actionIconActive]}>
        <Text style={[styles.actionSymbol, active && styles.actionSymbolActive]}>{symbol}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.black },
  short: { width: '100%', backgroundColor: palette.black },
  missingVideo: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  missingText: { color: palette.textMuted },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.10)',
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
    borderRadius: 18,
    backgroundColor: 'rgba(5,7,11,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  topCopy: { flex: 1, alignItems: 'flex-end' },
  topKicker: { color: palette.cyan, fontSize: 9, letterSpacing: 1.2, fontWeight: fontWeight.black },
  topTitle: { color: palette.white, fontSize: 22, fontWeight: fontWeight.black, marginTop: 2 },
  sideActions: {
    position: 'absolute',
    right: 14,
    bottom: 112,
    gap: spacing.lg,
  },
  action: { alignItems: 'center', gap: 4 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: 'rgba(5,7,11,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconActive: {
    borderColor: 'rgba(85,246,255,0.48)',
    backgroundColor: 'rgba(85,246,255,0.12)',
  },
  actionSymbol: { color: palette.white, fontSize: 24 },
  actionSymbolActive: { color: palette.cyan },
  actionLabel: { color: palette.white, fontSize: 10, fontWeight: fontWeight.bold },
  bottomCopy: {
    position: 'absolute',
    left: 18,
    right: 84,
    bottom: 42,
    alignItems: 'flex-end',
  },
  channelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  channelDot: {
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: palette.blue,
    transform: [{ rotate: '45deg' }],
  },
  channelName: {
    color: palette.cyan,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
  },
  shortTitle: {
    color: palette.white,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: fontWeight.black,
    textAlign: 'right',
  },
  excerpt: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: typeScale.bodySm,
    lineHeight: 21,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});

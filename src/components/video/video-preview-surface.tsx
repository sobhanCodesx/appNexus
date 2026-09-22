import { useEventListener } from 'expo';
import { useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fontFamily, fontWeight, palette, radii } from '@/design';
import type { ContentCard } from '@/types/api';

const PREVIEW_LIMIT_MS = 8_000;

type PreviewableContent = ContentCard & {
  media?: {
    type?: string | null;
    url?: string | null;
    thumbnail?: string | null;
    duration?: number | null;
  }[];
};

export function videoPreviewUrl(item: PreviewableContent) {
  return item.video_url
    || item.media?.find((media) => media.type === 'video' && media.url)?.url
    || null;
}

export function VideoPreviewSurface({
  item,
  active,
  compact = false,
}: {
  item: PreviewableContent;
  active: boolean;
  compact?: boolean;
}) {
  const source = videoPreviewUrl(item);

  if (!active || !source || item.type !== 'video') return null;

  return <PreviewPlayer key={source} source={String(source)} compact={compact} />;
}

function PreviewPlayer({ source, compact }: { source: string; compact: boolean }) {
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);

  const player = useVideoPlayer({ uri: source }, (instance) => {
    instance.muted = true;
    instance.loop = false;
    instance.timeUpdateEventInterval = 0.12;
    instance.currentTime = 0;
    instance.play();
  });

  useFocusEffect(
    useCallback(() => {
      if (!finished) player.play();

      return () => {
        player.pause();
      };
    }, [finished, player]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      player.pause();
      setFinished(true);
    }, PREVIEW_LIMIT_MS);

    return () => clearTimeout(timer);
  }, [player]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration || 0;
    const previewDuration = Math.min(duration || 8, 8);
    setProgress(previewDuration > 0 ? Math.min(1, currentTime / previewDuration) : 0);
  });

  useEventListener(player, 'playToEnd', () => {
    setProgress(1);
    setFinished(true);
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={[styles.badge, compact && styles.badgeCompact]}>
        <View style={[styles.liveDot, finished && styles.finishedDot]} />
        <Text style={styles.badgeText}>{finished ? 'PREVIEWED' : 'PREVIEW · MUTE'}</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.progress, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    height: 27,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(3,5,9,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeCompact: {
    top: 8,
    left: 8,
    height: 24,
    paddingHorizontal: 7,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  finishedDot: {
    backgroundColor: palette.textDim,
  },
  badgeText: {
    color: palette.white,
    fontFamily: fontFamily.black,
    fontWeight: fontWeight.black,
    fontSize: 7,
    letterSpacing: 0.7,
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  progress: {
    height: 3,
    backgroundColor: palette.cyan,
  },
});

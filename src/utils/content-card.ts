import type { ContentCard } from '@/types/api';

type RawMedia = {
  type?: string | null;
  url?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
};

type RawAuthor = {
  name?: string | null;
  avatar_url?: string | null;
  url?: string | null;
};

type RawContentCard = ContentCard & {
  feed_slug?: string | null;
  url?: string | null;
  created_at?: string | null;
  media?: RawMedia[];
  author?: RawAuthor | null;
};

function slugFromUrl(value?: string | null) {
  if (!value) return null;
  const clean = value.split('?')[0].replace(/\/$/, '');
  const parts = clean.split('/').filter(Boolean);
  return parts.at(-1) || null;
}

function imageFromMedia(media?: RawMedia[]) {
  for (const item of media || []) {
    if (item.thumbnail) return item.thumbnail;
    if (item.type === 'image' && item.url) return item.url;
  }
  return null;
}

export function normalizeContentCard(input: ContentCard): ContentCard {
  const raw = input as RawContentCard;
  const mediaImage = imageFromMedia(raw.media);
  const videoMedia = raw.media?.find((item) => item.type === 'video');

  return {
    ...raw,
    slug:
      raw.slug
      || raw.feed_slug
      || slugFromUrl(raw.url)
      || String(raw.id),
    image_url:
      raw.image_url
      || raw.thumbnail_url
      || raw.cover_url
      || mediaImage,
    thumbnail_url:
      raw.thumbnail_url
      || mediaImage,
    video_url:
      raw.video_url
      || videoMedia?.url
      || null,
    duration:
      raw.duration
      ?? videoMedia?.duration
      ?? null,
    published_at:
      raw.published_at
      || raw.created_at
      || null,
    channel:
      raw.channel
      || (raw.author?.name
        ? {
            id: 0,
            name: raw.author.name,
            url: raw.author.url || undefined,
            avatar_url: raw.author.avatar_url || undefined,
          }
        : null),
  };
}

export function normalizeContentCards(items?: ContentCard[] | null) {
  return (items || []).map(normalizeContentCard);
}

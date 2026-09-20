export type ImageUrl = string | null | undefined;

export type HomeSlide = {
  id: number;
  title?: string | null;
  eyebrow?: string | null;
  description?: string | null;
  mobile_image_url?: ImageUrl;
  desktop_image_url?: ImageUrl;
};

export type GameRadarItem = {
  id: string | number;
  title: string;
  banner_url?: ImageUrl;
  cover_url?: ImageUrl;
  playnexus_url?: string | null;
  psn?: { available?: boolean; url?: string | null };
  xbox?: { available?: boolean; url?: string | null };
};

export type ContentCard = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  thumbnail_url?: ImageUrl;
  image_url?: ImageUrl;
  cover_url?: ImageUrl;
  views?: number;
  duration?: number | null;
  game?: {
    id: number;
    name: string;
    slug: string;
    cover_url?: ImageUrl;
  } | null;
};

export type StudioCard = {
  id: number;
  name: string;
  slug: string;
  logo_url?: ImageUrl;
  background_url?: ImageUrl;
  channels_count?: number;
};

export type HomePayload = {
  slides?: HomeSlide[];
  latest_feed?: ContentCard[];
  game_radar?: GameRadarItem[];
  latest_studios?: StudioCard[];
  personalized_home?: {
    feed?: ContentCard[];
    videos?: ContentCard[];
    radar?: GameRadarItem[];
    followed_games?: Array<{
      id: number;
      name: string;
      slug: string;
      image_url?: ImageUrl;
    }>;
    intelligence?: {
      confidence?: { key?: string; label?: string };
      focus_reason?: string | null;
    };
  } | null;
};

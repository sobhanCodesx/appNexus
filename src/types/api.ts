export type ImageUrl = string | null | undefined;

export type Paginated<T> = {
  data: T[];
  current_page?: number;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  last_page?: number;
  total?: number;
};

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
  feed_type?: string | null;
  badge?: string | null;
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
    followed_games?: Array<{ id: number; name: string; slug: string; image_url?: ImageUrl }>;
    intelligence?: {
      confidence?: { key?: string; label?: string };
      focus_reason?: string | null;
    };
  } | null;
};

export type DiscoverItem = {
  key: string;
  kind: 'content' | 'product_media';
  data: Record<string, any>;
};

export type SearchPayload = {
  query: string;
  products: Array<Record<string, any>>;
  content: ContentCard[];
  categories: Array<Record<string, any>>;
  channels: Array<Record<string, any>>;
};

export type ProfilePayload = {
  profile: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar_url?: ImageUrl;
    wallet_balance?: number;
    role?: string;
  };
  wallet_balance?: number;
  unread_notifications_count?: number;
  profile_completion?: number;
  order_status_counts?: Record<string, number>;
};

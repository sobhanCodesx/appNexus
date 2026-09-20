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

export type ContentChannel = {
  id: number;
  name: string;
  slug?: string;
  url?: string;
  avatar_url?: ImageUrl;
};

export type ContentCard = {
  id: number;
  type?: 'post' | 'video' | 'short';
  title: string;
  slug: string;
  excerpt?: string | null;
  thumbnail_url?: ImageUrl;
  image_url?: ImageUrl;
  cover_url?: ImageUrl;
  video_url?: ImageUrl;
  views?: number;
  duration?: number | null;
  feed_type?: string | null;
  badge?: string | null;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  allow_comments?: boolean;
  published_at?: string | null;
  channel?: ContentChannel | null;
  game?: {
    id: number;
    name: string;
    slug: string;
    cover_url?: ImageUrl;
  } | null;
};

export type ContentDetailPayload = {
  content: ContentCard & {
    body?: string | null;
    video_mime?: string | null;
    dislikes_count?: number;
    user_reaction?: 'like' | 'dislike' | null;
    is_saved?: boolean;
  };
  channel?: (ContentChannel & {
    background_url?: ImageUrl;
    subscribers_count?: number;
    is_subscribed?: boolean;
  }) | null;
  playlist?: Record<string, unknown> | null;
  related?: ContentCard[];
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
    followed_games?: { id: number; name: string; slug: string; image_url?: ImageUrl }[];
    intelligence?: {
      confidence?: { key?: string; label?: string };
      focus_reason?: string | null;
    };
  } | null;
};

export type DiscoverItem = {
  key: string;
  kind: 'content' | 'product_media';
  data: Record<string, unknown>;
};

export type SearchPayload = {
  query: string;
  products: Record<string, unknown>[];
  content: ContentCard[];
  categories: Record<string, unknown>[];
  channels: Record<string, unknown>[];
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

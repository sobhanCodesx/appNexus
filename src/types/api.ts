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
  link_type?: string | null;
  button_url?: string | null;
  button_label?: string | null;
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
  logo_url?: ImageUrl;
  cover_url?: ImageUrl;
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
  dislikes_count?: number;
  comments_count?: number;
  user_reaction?: 'like' | 'dislike' | null;
  is_liked?: boolean;
  is_saved?: boolean;
  allow_comments?: boolean;
  published_at?: string | null;
  media?: {
    type?: string | null;
    url?: ImageUrl;
    thumbnail?: ImageUrl;
    duration?: number | null;
  }[];
  channel?: ContentChannel | null;
  game?: {
    id: number;
    name: string;
    slug: string;
    cover_url?: ImageUrl;
  } | null;
};

export type VideoPlaylistContext = {
  id: number;
  title: string;
  slug: string;
  image_url?: ImageUrl;
  channel_name?: string | null;
  is_public?: boolean;
  current_id?: number;
  items?: ContentCard[];
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
  playlist?: VideoPlaylistContext | null;
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

export type NexusLatestItem = {
  key: string;
  kind: 'feed' | 'video' | 'studio' | 'game' | 'product';
  id: number;
  title: string;
  subtitle?: string | null;
  slug: string;
  image_url?: ImageUrl;
  url?: string | null;
  created_at?: string | null;
};

export type HomeGame = {
  id: number;
  name: string;
  slug: string;
  developer?: string | null;
  publisher?: string | null;
  cover_url?: ImageUrl;
  background_url?: ImageUrl;
  created_at?: string | null;
  studio?: {
    id: number;
    name: string;
    slug: string;
    logo_url?: ImageUrl;
  } | null;
};

export type HomeProduct = {
  id: number;
  title: string;
  slug: string;
  category?: string | null;
  badge?: string | null;
  availability?: string | null;
  stock?: number | null;
  trade_enabled?: boolean;
  cover_url?: ImageUrl;
  pricing?: {
    regular_price?: number;
    sale_price?: number;
    final_price?: number;
    discount_amount?: number;
    is_partner_price?: boolean;
  };
};

export type HomeCategory = {
  id: number;
  name: string;
  slug: string;
  image_url?: ImageUrl;
  products_count?: number;
};

export type HomeChannel = {
  id: number;
  name: string;
  slug: string;
  image_url?: ImageUrl;
  videos_count?: number;
  subscribers_count?: number;
};

export type HomeMixedItem = {
  key: string;
  type: 'product' | 'video';
  id: number;
  title: string;
  slug: string;
  image_url?: ImageUrl;
  eyebrow?: string | null;
  published_at?: string | null;
  duration?: number | null;
  views?: number;
  pricing?: HomeProduct['pricing'];
};

export type HomeContentSection = {
  id: number;
  title: string;
  subtitle?: string | null;
  content_type: 'products' | 'categories' | 'games' | 'brands' | 'platforms' | 'posts' | 'videos' | 'shorts' | string;
  layout?: string | null;
  items: (HomeProduct | ContentCard | {
    id: number;
    title: string;
    slug?: string | null;
    eyebrow?: string | null;
    excerpt?: string | null;
    image_url?: ImageUrl;
  })[];
};

export type HomePayload = {
  settings?: Record<string, unknown>;
  slides?: HomeSlide[];
  categories?: HomeCategory[];
  featured_products?: HomeProduct[];
  latest_products?: HomeProduct[];
  latest_feed?: ContentCard[];
  latest_videos?: ContentCard[];
  latest_games?: HomeGame[];
  nexus_latest?: NexusLatestItem[];
  game_radar?: GameRadarItem[];
  latest_studios?: StudioCard[];
  content_sections?: HomeContentSection[];
  fresh_content?: HomeMixedItem[];
  channels?: HomeChannel[];
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

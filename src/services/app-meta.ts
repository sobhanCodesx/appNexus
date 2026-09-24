import { apiRequest } from '@/services/api';

export type MobileAppMeta = {
  api_version: string;
  app: {
    name: string;
    locale: string;
    min_version: string;
    current_version: string;
  };
  features: Record<string, boolean>;
  nexus_ai?: {
    enabled: boolean;
    page_enabled: boolean;
    show_in_nav: boolean;
    title: string;
    description: string;
    nav_label: string;
    launcher_label: string;
    welcome_title: string;
    welcome_text: string;
    status_text: string;
  };
};

let cached: MobileAppMeta | null = null;
let cachedAt = 0;
let inFlight: Promise<MobileAppMeta> | null = null;
const META_TTL_MS = 2 * 60 * 1000;

export async function getAppMeta(force = false) {
  if (!force && cached && Date.now() - cachedAt < META_TTL_MS) return cached;
  if (!force && inFlight) return inFlight;

  inFlight = apiRequest<MobileAppMeta>('/meta', {}, { auth: false })
    .then((result) => {
      cached = result;
      cachedAt = Date.now();
      return result;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function currentAppMeta() {
  return cached;
}

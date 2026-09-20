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
};

let cached: MobileAppMeta | null = null;
let inFlight: Promise<MobileAppMeta> | null = null;

export async function getAppMeta(force = false) {
  if (!force && cached) return cached;
  if (!force && inFlight) return inFlight;

  inFlight = apiRequest<MobileAppMeta>('/meta', {}, { auth: false })
    .then((result) => {
      cached = result;
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

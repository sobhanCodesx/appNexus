const configuredApi = process.env.EXPO_PUBLIC_PLAYNEXUS_API_URL?.trim();
const configuredSite = process.env.EXPO_PUBLIC_PLAYNEXUS_URL?.trim();

export const PLAYNEXUS_API_URL = (configuredApi || 'https://playnexus.ir/api/v1').replace(/\/$/, '');
export const PLAYNEXUS_SITE_URL = (configuredSite || 'https://playnexus.ir').replace(/\/$/, '');

export const appConfig = {
  apiUrl: PLAYNEXUS_API_URL,
  siteUrl: PLAYNEXUS_SITE_URL,
  brandName: 'PlayNexus',
} as const;

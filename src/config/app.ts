import Constants from 'expo-constants';

const configuredApi = process.env.EXPO_PUBLIC_PLAYNEXUS_API_URL?.trim();
const configuredSite = process.env.EXPO_PUBLIC_PLAYNEXUS_URL?.trim();
const localApiPort =
  process.env.EXPO_PUBLIC_PLAYNEXUS_LOCAL_API_PORT?.trim() || '8000';

function expoLanHost() {
  if (!__DEV__) return null;

  const hostUri = Constants.expoConfig?.hostUri?.trim();
  if (!hostUri) return null;

  const rawHost = hostUri.startsWith('[')
    ? hostUri.slice(1, hostUri.indexOf(']'))
    : hostUri.split(':')[0];

  const isLanIpv4 =
    /^10\./.test(rawHost)
    || /^192\.168\./.test(rawHost)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(rawHost);

  if (!isLanIpv4 && rawHost !== '127.0.0.1' && rawHost !== 'localhost') {
    return null;
  }

  return rawHost;
}

const localHost = expoLanHost();
const inferredLocalApi = localHost
  ? `http://${localHost}:${localApiPort}/api/v1`
  : null;

export const PLAYNEXUS_API_URL = (
  configuredApi
  || inferredLocalApi
  || 'https://playnexus.ir/api/v1'
).replace(/\/$/, '');

export const PLAYNEXUS_SITE_URL = (
  configuredSite || 'https://playnexus.ir'
).replace(/\/$/, '');

export const appConfig = {
  apiUrl: PLAYNEXUS_API_URL,
  siteUrl: PLAYNEXUS_SITE_URL,
  brandName: 'PlayNexus',
  localDevelopmentApi: Boolean(!configuredApi && inferredLocalApi),
} as const;

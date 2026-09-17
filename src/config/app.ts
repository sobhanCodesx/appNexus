const configuredUrl = process.env.EXPO_PUBLIC_PLAYNEXUS_URL?.trim();

export const PLAYNEXUS_URL = configuredUrl?.replace(/\/$/, '') ?? '';

export const isPlayNexusConfigured = PLAYNEXUS_URL.startsWith('https://');

export const PLAYNEXUS_ORIGIN = isPlayNexusConfigured ? new URL(PLAYNEXUS_URL).origin : '';

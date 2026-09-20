import * as SecureStore from 'expo-secure-store';

import { PLAYNEXUS_API_URL } from '@/config/app';

const TOKEN_KEY = 'playnexus.mobile-access-token.v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
  }
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setAccessToken(token: string | null) {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);
  const token = options.auth === false ? null : await getAccessToken();

  try {
    const isMultipart = typeof FormData !== 'undefined' && init.body instanceof FormData;

    const response = await fetch(PLAYNEXUS_API_URL + path, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(init.headers ?? {}),
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        typeof payload?.message === 'string' ? payload.message : 'درخواست به PlayNexus ناموفق بود.',
        response.status,
        payload,
      );
    }

    return payload as T;
  } finally {
    clearTimeout(timeout);
  }
}

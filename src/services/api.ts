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

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);
  let token = options.auth === false ? null : await getAccessToken();

  try {
    const isMultipart = typeof FormData !== 'undefined' && init.body instanceof FormData;
    const method = String(init.method || 'GET').toUpperCase();

    const request = async (accessToken: string | null) => {
      const response = await fetch(PLAYNEXUS_API_URL + path, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
          ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
          ...(init.headers ?? {}),
        },
      });

      return {
        response,
        payload: await parseResponse(response),
      };
    };

    let result = await request(token);

    // A dev build can retain a bearer token issued by another backend or an
    // older PlayNexus session. Public GET endpoints such as /home are allowed
    // to continue as guest, so recover once without the stale token.
    if (
      result.response.status === 401
      && token
      && options.auth !== false
      && (method === 'GET' || method === 'HEAD')
    ) {
      await setAccessToken(null);
      token = null;
      result = await request(null);
    }

    if (!result.response.ok) {
      const serverMessage =
        typeof result.payload?.message === 'string'
          ? result.payload.message
          : 'درخواست به PlayNexus ناموفق بود.';

      const debugSuffix = __DEV__
        ? ` (HTTP ${result.response.status} · ${PLAYNEXUS_API_URL}${path})`
        : '';

      throw new ApiError(
        serverMessage + debugSuffix,
        result.response.status,
        result.payload,
      );
    }

    return result.payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    const timedOut = error instanceof Error && error.name === 'AbortError';
    throw new ApiError(
      timedOut
        ? `اتصال به PlayNexus API زمان‌بر شد. (${PLAYNEXUS_API_URL}${path})`
        : `اتصال به PlayNexus API برقرار نشد. (${PLAYNEXUS_API_URL}${path})`,
      0,
      { base_url: PLAYNEXUS_API_URL },
    );
  } finally {
    clearTimeout(timeout);
  }
}

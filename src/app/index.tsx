import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import * as Network from 'expo-network';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';

import { isPlayNexusConfigured, PLAYNEXUS_ORIGIN, PLAYNEXUS_URL } from '@/config/app';
import { getInstallationId } from '@/services/installation';
import { getPushRegistration, notificationUrl } from '@/services/notifications';

type BridgeMessage = {
  protocol?: string;
  event?:
    | 'AUTH_STATE'
    | 'NAVIGATION'
    | 'SHARE'
    | 'DEVICE_REGISTERED'
    | 'DEVICE_REGISTRATION_FAILED';
  payload?: Record<string, unknown>;
};

const LAST_URL_KEY = 'playnexus.last-url.v1';
let pendingNotificationUrl: string | null = null;

function resolveInternalUrl(value: string): string | null {
  if (!isPlayNexusConfigured) return null;

  try {
    const url = new URL(value, PLAYNEXUS_URL);
    return url.origin === PLAYNEXUS_ORIGIN ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function PlayNexusScreen() {
  const webView = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const registeredToken = useRef<string | null>(null);
  const pendingRegistrationToken = useRef<string | null>(null);
  const registrationInFlight = useRef(false);
  const authenticated = useRef(false);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const network = Network.useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;

  const openInternalUrl = useCallback((value: string) => {
    const url = resolveInternalUrl(value);
    if (!url) return;

    pendingNotificationUrl = null;
    webView.current?.injectJavaScript(`window.location.href=${JSON.stringify(url)};true;`);
  }, []);

  const registerDevice = useCallback(async (devicePushToken?: Notifications.DevicePushToken) => {
    if (!authenticated.current || !webView.current || registrationInFlight.current) return;

    registrationInFlight.current = true;

    try {
      const [installationId, pushRegistration] = await Promise.all([
        getInstallationId(),
        getPushRegistration(devicePushToken),
      ]);

      if (!pushRegistration || registeredToken.current === pushRegistration.token) {
        registrationInFlight.current = false;
        return;
      }

      pendingRegistrationToken.current = pushRegistration.token;

      const payload = {
        installation_id: installationId,
        push_token: pushRegistration.token,
        push_provider: pushRegistration.provider,
        platform: Platform.OS,
        device_name: Application.applicationName ?? undefined,
        app_version: Application.nativeApplicationVersion ?? undefined,
      };

      webView.current.injectJavaScript(`
        (async () => {
          try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/mobile/devices', {
              method: 'PUT',
              credentials: 'same-origin',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrf ? {'X-CSRF-TOKEN': csrf} : {})
              },
              body: ${JSON.stringify(JSON.stringify(payload))}
            });

            let data = null;
            try { data = await response.json(); } catch {}

            if (!response.ok || data?.registered !== true) {
              const detail = data?.message || data?.error || ('HTTP ' + response.status);
              throw new Error(detail);
            }

            window.ReactNativeWebView?.postMessage(JSON.stringify({
              protocol: 'playnexus.native.v1',
              event: 'DEVICE_REGISTERED'
            }));
          } catch (error) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              protocol: 'playnexus.native.v1',
              event: 'DEVICE_REGISTRATION_FAILED',
              payload: {message: String(error)}
            }));
          }
        })();true;
      `);
    } catch (error) {
      pendingRegistrationToken.current = null;
      registrationInFlight.current = false;
      console.warn('Push registration is not available:', error);
    }
  }, []);

  const syncAuthState = useCallback(() => {
    if (!webView.current) return;

    webView.current.injectJavaScript(`
      (async () => {
        try {
          const response = await fetch('/mobile/session', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          let data = null;
          try { data = await response.json(); } catch {}

          window.ReactNativeWebView?.postMessage(JSON.stringify({
            protocol: 'playnexus.native.v1',
            event: 'AUTH_STATE',
            payload: {
              authenticated: response.ok && data?.authenticated === true,
              userId: response.ok && typeof data?.user_id === 'number' ? data.user_id : null
            }
          }));
        } catch {}
      })();true;
    `);
  }, []);

  useEffect(() => {
    if (!isPlayNexusConfigured) return;

    void (async () => {
      const lastResponse = Notifications.getLastNotificationResponse();
      const notificationTarget = lastResponse ? notificationUrl(lastResponse.notification) : null;
      const incomingLink = await Linking.getInitialURL();
      const incomingTarget = incomingLink?.startsWith('playnexus://open')
        ? new URL(incomingLink).searchParams.get('url')
        : null;
      const savedTarget = await SecureStore.getItemAsync(LAST_URL_KEY);
      const target = resolveInternalUrl(notificationTarget ?? incomingTarget ?? savedTarget ?? '');
      setInitialUrl(target ?? PLAYNEXUS_URL);
    })();

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const target = notificationUrl(response.notification);
      if (!target) return;
      pendingNotificationUrl = target;
      openInternalUrl(target);
    });
    const tokenSubscription = Notifications.addPushTokenListener((token) => {
      registeredToken.current = null;
      pendingRegistrationToken.current = null;
      if (!registrationInFlight.current) void registerDevice(token);
    });

    return () => {
      responseSubscription.remove();
      tokenSubscription.remove();
    };
  }, [openInternalUrl, registerDevice]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack.current) return false;
      webView.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: BridgeMessage;
      try {
        message = JSON.parse(event.nativeEvent.data) as BridgeMessage;
      } catch {
        return;
      }
      if (message.protocol !== 'playnexus.native.v1') return;

      if (message.event === 'AUTH_STATE') {
        const isAuthenticated = message.payload?.authenticated === true;
        authenticated.current = isAuthenticated;
        if (isAuthenticated) {
          void registerDevice();
        } else {
          registeredToken.current = null;
          pendingRegistrationToken.current = null;
          registrationInFlight.current = false;
        }
      }

      if (message.event === 'NAVIGATION' && typeof message.payload?.url === 'string') {
        const url = resolveInternalUrl(message.payload.url);
        if (url) void SecureStore.setItemAsync(LAST_URL_KEY, url);
      }

      if (message.event === 'DEVICE_REGISTERED') {
        registeredToken.current = pendingRegistrationToken.current;
        pendingRegistrationToken.current = null;
        registrationInFlight.current = false;
      }

      if (message.event === 'DEVICE_REGISTRATION_FAILED') {
        registeredToken.current = null;
        pendingRegistrationToken.current = null;
        registrationInFlight.current = false;
        if (__DEV__) console.warn('Device registration failed:', message.payload?.message);
      }

      if (
        message.event === 'SHARE' &&
        typeof message.payload?.title === 'string' &&
        typeof message.payload.url === 'string'
      ) {
        void Share.share({
          title: message.payload.title,
          message: `${typeof message.payload.text === 'string' ? `${message.payload.text}\n` : ''}${message.payload.url}`,
          url: message.payload.url,
        });
      }
    },
    [registerDevice],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      syncAuthState();
      if (authenticated.current && !registeredToken.current) void registerDevice();
    });

    return () => subscription.remove();
  }, [registerDevice, syncAuthState]);

  useEffect(() => {
    if (offline || !authenticated.current || registeredToken.current) return;
    void registerDevice();
  }, [offline, registerDevice]);

  const retry = useCallback(() => {
    setLoadFailed(false);
    setLoading(true);
    webView.current?.reload();
  }, []);

  if (!isPlayNexusConfigured) {
    return <StateScreen title="آدرس PlayNexus تنظیم نشده است" detail="متغیر EXPO_PUBLIC_PLAYNEXUS_URL را با آدرس HTTPS سایت تنظیم کنید." />;
  }

  if (!initialUrl) {
    return <StateScreen title="در حال آماده‌سازی PlayNexus…" loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <WebView
        ref={webView}
        source={{ uri: initialUrl }}
        style={styles.webView}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        cacheEnabled
        domStorageEnabled
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        onMessage={onMessage}
        onNavigationStateChange={(state: WebViewNavigation) => {
          canGoBack.current = state.canGoBack;
        }}
        onLoadStart={() => {
          setLoading(true);
          setLoadFailed(false);
        }}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        onLoadEnd={() => {
          setLoading(false);
          syncAuthState();
          if (pendingNotificationUrl) openInternalUrl(pendingNotificationUrl);
        }}
        onError={() => {
          setLoadFailed(true);
          setLoading(false);
        }}
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.statusCode >= 500) setLoadFailed(true);
        }}
        onContentProcessDidTerminate={retry}
        onShouldStartLoadWithRequest={(request) => {
          if (resolveInternalUrl(request.url)) return true;
          if (request.url === 'about:blank') return true;
          void Linking.openURL(request.url).catch(() => undefined);
          return false;
        }}
      />

      {loading && !loadFailed && !offline ? (
        <View pointerEvents="none" style={styles.loadingBarTrack}>
          <View style={[styles.loadingBar, { width: `${Math.max(progress * 100, 8)}%` }]} />
        </View>
      ) : null}

      {offline || loadFailed ? (
        <View style={styles.overlay}>
          <Text style={styles.stateTitle}>{offline ? 'اتصال اینترنت برقرار نیست' : 'بارگذاری PlayNexus انجام نشد'}</Text>
          <Text style={styles.stateDetail}>اتصال خود را بررسی کنید و دوباره تلاش کنید.</Text>
          <Pressable accessibilityRole="button" onPress={retry} style={styles.retryButton}>
            <Text style={styles.retryText}>تلاش دوباره</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function StateScreen({ title, detail, loading = false }: { title: string; detail?: string; loading?: boolean }) {
  return (
    <SafeAreaView style={styles.stateScreen}>
      {loading ? <ActivityIndicator color="#208AEF" size="large" /> : null}
      <Text style={styles.stateTitle}>{title}</Text>
      {detail ? <Text style={styles.stateDetail}>{detail}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#09090b' },
  webView: { flex: 1, backgroundColor: '#09090b' },
  loadingBarTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#18181b' },
  loadingBar: { height: 3, backgroundColor: '#208AEF' },
  overlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28, backgroundColor: '#09090b' },
  stateScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28, backgroundColor: '#09090b' },
  stateTitle: { color: '#fafafa', fontSize: 19, fontWeight: '700', textAlign: 'center' },
  stateDetail: { color: '#a1a1aa', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  retryButton: { marginTop: 8, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#208AEF' },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

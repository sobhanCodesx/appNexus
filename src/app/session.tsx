import * as Application from 'expo-application';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { apiRequest } from '@/services/api';
import { getAppMeta, type MobileAppMeta } from '@/services/app-meta';
import { getInstallationId } from '@/services/installation';

type SessionPayload = {
  authenticated: boolean;
  user_id: number;
  token: {
    id?: number | null;
    device_name?: string | null;
    expires_at?: string | null;
  };
};

export default function SessionScreen() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [meta, setMeta] = useState<MobileAppMeta | null>(null);
  const [installationId, setInstallationId] = useState('');

  useEffect(() => {
    void Promise.all([
      apiRequest<SessionPayload>('/session'),
      getAppMeta(),
      getInstallationId(),
    ]).then(([nextSession, nextMeta, installation]) => {
      setSession(nextSession);
      setMeta(nextMeta);
      setInstallationId(installation);
    });
  }, []);

  return (
    <Screen>
      <PageHeader title="Session" subtitle="MOBILE API STATUS" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.status}>
          <View style={styles.onlineDot} />
          <View style={styles.statusCopy}>
            <Text style={styles.kicker}>CURRENT SESSION</Text>
            <Text style={styles.title}>
              {session?.authenticated ? 'اتصال حساب فعال است' : 'در حال بررسی…'}
            </Text>
          </View>
        </View>

        <Panel title="توکن موبایل">
          <Row label="User ID" value={session?.user_id ? String(session.user_id) : '—'} />
          <Row label="Device" value={session?.token.device_name || 'PlayNexus Device'} />
          <Row
            label="Expires"
            value={session?.token.expires_at
              ? new Date(session.token.expires_at).toLocaleString('fa-IR')
              : 'بدون تاریخ'}
          />
        </Panel>

        <Panel title="نسخه و API">
          <Row label="App" value={Application.nativeApplicationVersion || '1.0.0'} />
          <Row label="API" value={meta?.api_version || '—'} />
          <Row label="Server version" value={meta?.app.current_version || '—'} />
          <Row label="Minimum version" value={meta?.app.min_version || '—'} />
        </Panel>

        <Panel title="قابلیت‌های سرور">
          <View style={styles.features}>
            {Object.entries(meta?.features || {}).map(([key, enabled]) => (
              <View key={key} style={styles.feature}>
                <View style={[styles.featureDot, enabled ? styles.featureOn : styles.featureOff]} />
                <Text style={styles.featureText}>{key}</Text>
              </View>
            ))}
          </View>
        </Panel>

        <Panel title="Installation">
          <Text selectable style={styles.installation}>{installationId || '—'}</Text>
        </Panel>

        <PressableScale haptic={false} onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>برگشت</Text>
        </PressableScale>
      </ScrollView>
    </Screen>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 80, gap: spacing.md },
  status: { minHeight: 92, borderRadius: radii.xl, borderWidth: 1, borderColor: 'rgba(80,232,176,0.18)', backgroundColor: 'rgba(80,232,176,0.04)', padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  onlineDot: { width: 10, height: 10, borderRadius: 10, backgroundColor: palette.success },
  statusCopy: { flex: 1, alignItems: 'flex-end' },
  kicker: { color: palette.success, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: 18, marginTop: 4 },
  panel: { borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.lg },
  panelTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: 17, textAlign: 'right', marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 6 },
  label: { color: palette.textMuted, fontFamily: fontFamily.regular },
  value: { color: palette.text, fontFamily: fontFamily.bold, flexShrink: 1, textAlign: 'left' },
  features: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs },
  feature: { minHeight: 32, paddingHorizontal: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: palette.line, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  featureDot: { width: 5, height: 5, borderRadius: 5 },
  featureOn: { backgroundColor: palette.success },
  featureOff: { backgroundColor: palette.danger },
  featureText: { color: palette.textMuted, fontFamily: fontFamily.bold, fontSize: 9 },
  installation: { color: palette.textMuted, fontFamily: fontFamily.regular, textAlign: 'left', fontSize: 10 },
  back: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.cyan, fontFamily: fontFamily.bold },
});

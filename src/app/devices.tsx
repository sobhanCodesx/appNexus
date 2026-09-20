import { FlashList } from '@shopify/flash-list';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, layout, palette, radii, spacing } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { getInstallationId } from '@/services/installation';
import { registerNativePushDevice } from '@/services/push';
import { invalidateResource } from '@/services/resource-cache';

type Device = {
  id: number;
  installation_id: string;
  platform: string;
  device_name?: string | null;
  app_version?: string | null;
  push_provider?: string | null;
  push_enabled?: boolean;
  last_seen_at?: string | null;
  created_at?: string | null;
};
type Payload = { devices: Device[] };

export default function DevicesScreen() {
  const { data, refreshing, refresh } = useApiResource<Payload>('/devices', { devices: [] });

  const remove = async (installationId: string) => {
    await apiRequest('/devices/' + encodeURIComponent(installationId), { method: 'DELETE' });
    invalidateResource('/devices');
    await refresh();
  };

  const enableThis = async () => {
    await registerNativePushDevice();
    invalidateResource('/devices');
    await refresh();
  };

  return (
    <Screen>
      <PageHeader title="Devices" subtitle="PUSH & SESSIONS" />
      <View style={styles.actions}>
        <PressableScale onPress={() => void enableThis()} style={styles.primary}>
          <Text style={styles.primaryText}>ثبت این دستگاه برای Push</Text>
        </PressableScale>
      </View>
      <FlashList
        data={data.devices || []}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <DeviceRow item={item} onRemove={() => void remove(item.installation_id)} />
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>هنوز دستگاه Push ثبت نشده.</Text></View>}
      />
    </Screen>
  );
}

function DeviceRow({ item, onRemove }: { item: Device; onRemove: () => void }) {
  const platformLabel = item.platform === 'ios' ? 'iOS' : 'Android';
  return (
    <View style={styles.device}>
      <View style={styles.icon}><Text style={styles.iconText}>{item.platform === 'ios' ? '◉' : '◆'}</Text></View>
      <View style={styles.copy}>
        <Text style={styles.name}>{item.device_name || platformLabel + ' Device'}</Text>
        <Text style={styles.meta}>{platformLabel} · v{item.app_version || '—'} · Push {item.push_enabled ? 'ON' : 'OFF'}</Text>
        <Text style={styles.meta}>{item.last_seen_at ? new Date(item.last_seen_at).toLocaleString('fa-IR') : 'بدون فعالیت ثبت‌شده'}</Text>
      </View>
      <PressableScale haptic={false} onPress={onRemove} style={styles.remove}><Text style={styles.removeText}>حذف</Text></PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { paddingHorizontal: layout.screenPadding, paddingBottom: spacing.md },
  primary: { minHeight: 50, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: palette.ink, fontFamily: fontFamily.black },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 80 },
  device: { minHeight: 100, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(88,244,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  iconText: { color: Platform.OS === 'ios' ? palette.violet : palette.cyan, fontSize: 18 },
  copy: { flex: 1, alignItems: 'flex-end' },
  name: { color: palette.white, fontFamily: fontFamily.black, textAlign: 'right' },
  meta: { color: palette.textMuted, fontFamily: fontFamily.regular, fontSize: 10, marginTop: 3, textAlign: 'right' },
  remove: { paddingHorizontal: spacing.sm, minHeight: 38, justifyContent: 'center' },
  removeText: { color: palette.danger, fontFamily: fontFamily.bold, fontSize: 11 },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyText: { color: palette.textMuted, fontFamily: fontFamily.regular },
});

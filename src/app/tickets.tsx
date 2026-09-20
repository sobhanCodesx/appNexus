import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import type { Paginated } from '@/types/api';

type Ticket = {
  id: number;
  number: string;
  subject: string;
  status: string;
  type?: string;
  exchange_status?: string | null;
  last_replied_at?: string | null;
  replies_count?: number;
};

type Payload = {
  tickets: Paginated<Ticket>;
  stats: { pending?: number; open?: number; closed?: number };
};

const empty: Payload = { tickets: { data: [] }, stats: {} };

const labels: Record<string, string> = {
  pending: 'در انتظار',
  open: 'باز',
  closed: 'بسته',
};

export default function TicketsScreen() {
  const { data, refreshing, refresh } = useApiResource<Payload>('/tickets', empty);

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
        <PressableScale onPress={() => router.push('/ticket/new')} style={styles.newButton}>
          <Text style={styles.newButtonText}>+ جدید</Text>
        </PressableScale>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>SUPPORT</Text>
          <Text style={styles.title}>پشتیبانی</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="در انتظار" value={data.stats.pending || 0} />
        <Stat label="باز" value={data.stats.open || 0} />
        <Stat label="بسته" value={data.stats.closed || 0} />
      </View>

      <FlashList
        data={data.tickets.data || []}
        renderItem={({ item }) => (
          <PressableScale
            style={styles.ticket}
            onPress={() => router.push({ pathname: '/ticket/[id]', params: { id: String(item.id) } })}>
            <View style={styles.ticketTop}>
              <View style={styles.status}><Text style={styles.statusText}>{labels[item.status] || item.status}</Text></View>
              <View style={styles.ticketCopy}>
                <Text style={styles.number}>{item.number}</Text>
                <Text numberOfLines={2} style={styles.subject}>{item.subject}</Text>
              </View>
            </View>
            <Text style={styles.meta}>{item.replies_count || 0} پاسخ</Text>
          </PressableScale>
        )}
        refreshing={refreshing}
        onRefresh={refresh}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>تیکتی نداری؛ امیدواریم همین‌طور بمونه 😄</Text></View>
        }
      />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value.toLocaleString('fa-IR')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  newButton: { minHeight: 42, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  newButtonText: { color: palette.ink, fontWeight: fontWeight.black, fontSize: typeScale.caption },
  copy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, marginTop: 3 },
  stats: { flexDirection: 'row-reverse', gap: spacing.sm, paddingHorizontal: layout.screenPadding, paddingBottom: spacing.lg },
  stat: { flex: 1, minHeight: 76, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  statValue: { color: palette.white, fontSize: typeScale.titleSm, fontWeight: fontWeight.black },
  statLabel: { color: palette.textMuted, fontSize: typeScale.micro, marginTop: 3 },
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 60 },
  ticket: { minHeight: 126, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.lg, marginBottom: spacing.sm, alignItems: 'flex-end' },
  ticketTop: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  ticketCopy: { flex: 1, alignItems: 'flex-end' },
  number: { color: palette.cyan, fontSize: 10, fontWeight: fontWeight.black },
  subject: { color: palette.text, fontSize: typeScale.body, lineHeight: 23, fontWeight: fontWeight.bold, textAlign: 'right', marginTop: 4 },
  status: { borderRadius: radii.pill, borderWidth: 1, borderColor: palette.lineStrong, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: palette.textMuted, fontSize: 10, fontWeight: fontWeight.bold },
  meta: { color: palette.textDim, fontSize: typeScale.micro, marginTop: spacing.md },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyText: { color: palette.textMuted, textAlign: 'center' },
});

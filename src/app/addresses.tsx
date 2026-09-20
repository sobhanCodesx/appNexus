import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';

type Address = {
  id: number;
  title: string;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  postal_code?: string | null;
  address_line: string;
  plaque?: string | null;
  unit?: string | null;
  is_default?: boolean;
};

type Payload = { addresses: Address[] };

const blank = {
  title: 'خانه',
  recipient_name: '',
  phone: '',
  postal_code: '',
  address_line: '',
  plaque: '',
  unit: '',
  is_default: true,
};

export default function AddressesScreen() {
  const { data, refresh } = useApiResource<Payload>('/addresses', { addresses: [] });
  const [form, setForm] = useState(blank);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/addresses', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          province: 'تهران',
          city: 'تهران',
          postal_code: form.postal_code || null,
          plaque: form.plaque || null,
          unit: form.unit || null,
        }),
      });
      invalidateResource('/addresses');
      setForm(blank);
      setShowForm(false);
      await refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'آدرس ذخیره نشد.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    await apiRequest('/addresses/' + id, { method: 'DELETE' });
    invalidateResource('/addresses');
    await refresh();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></PressableScale>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>DELIVERY</Text>
          <Text style={styles.title}>آدرس‌ها</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {(data.addresses || []).map((address) => (
          <View key={address.id} style={[styles.address, address.is_default && styles.addressDefault]}>
            <View style={styles.addressTop}>
              <PressableScale haptic onPress={() => void remove(address.id)} style={styles.delete}>
                <Text style={styles.deleteText}>حذف</Text>
              </PressableScale>
              <View style={styles.addressCopy}>
                <Text style={styles.addressTitle}>{address.title}{address.is_default ? ' · پیش‌فرض' : ''}</Text>
                <Text style={styles.addressText}>{address.recipient_name} · {address.phone}</Text>
                <Text style={styles.addressText}>تهران، {address.address_line}</Text>
              </View>
            </View>
          </View>
        ))}

        {!showForm ? (
          <PressableScale style={styles.add} onPress={() => setShowForm(true)}>
            <Text style={styles.addText}>+ آدرس جدید</Text>
          </PressableScale>
        ) : (
          <View style={styles.form}>
            <Text style={styles.formTitle}>آدرس جدید</Text>
            <Field value={form.title} placeholder="عنوان آدرس" onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} />
            <Field value={form.recipient_name} placeholder="نام تحویل‌گیرنده" onChange={(value) => setForm((prev) => ({ ...prev, recipient_name: value }))} />
            <Field value={form.phone} placeholder="شماره تماس 09..." keyboard="phone-pad" onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
            <Field value={form.address_line} placeholder="نشانی کامل در تهران" multiline onChange={(value) => setForm((prev) => ({ ...prev, address_line: value }))} />
            <View style={styles.split}>
              <Field compact value={form.plaque} placeholder="پلاک" onChange={(value) => setForm((prev) => ({ ...prev, plaque: value }))} />
              <Field compact value={form.unit} placeholder="واحد" onChange={(value) => setForm((prev) => ({ ...prev, unit: value }))} />
            </View>
            <Field value={form.postal_code} placeholder="کدپستی ۱۰ رقمی" keyboard="number-pad" onChange={(value) => setForm((prev) => ({ ...prev, postal_code: value }))} />

            <View style={styles.defaultRow}>
              <Switch
                value={form.is_default}
                onValueChange={(value) => setForm((prev) => ({ ...prev, is_default: value }))}
                trackColor={{ false: palette.surfaceBright, true: palette.blueHot }}
                thumbColor={palette.white}
              />
              <Text style={styles.defaultText}>آدرس پیش‌فرض</Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PressableScale disabled={saving} style={styles.save} onPress={() => void save()}>
              <Text style={styles.saveText}>{saving ? 'در حال ذخیره…' : 'ذخیره آدرس'}</Text>
            </PressableScale>
            <PressableScale style={styles.cancel} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelText}>انصراف</Text>
            </PressableScale>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Field({
  value,
  placeholder,
  onChange,
  multiline = false,
  keyboard,
  compact = false,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  keyboard?: 'default' | 'phone-pad' | 'number-pad';
  compact?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={palette.textDim}
      multiline={multiline}
      keyboardType={keyboard}
      textAlign="right"
      style={[styles.input, multiline && styles.inputMultiline, compact && styles.inputCompact]}
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { width: 46, height: 46, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.white, fontSize: 26, fontWeight: fontWeight.bold },
  headerCopy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: palette.cyan, fontSize: 9, fontWeight: fontWeight.black, letterSpacing: 1 },
  title: { color: palette.white, fontSize: 30, fontWeight: fontWeight.black, marginTop: 3 },
  scroll: { paddingHorizontal: layout.screenPadding, paddingBottom: 60 },
  address: { minHeight: 110, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md, marginBottom: spacing.sm },
  addressDefault: { borderColor: 'rgba(77,163,255,0.40)', backgroundColor: 'rgba(77,163,255,0.06)' },
  addressTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  addressCopy: { flex: 1, alignItems: 'flex-end' },
  addressTitle: { color: palette.white, fontSize: typeScale.body, fontWeight: fontWeight.bold },
  addressText: { color: palette.textMuted, fontSize: typeScale.caption, lineHeight: 20, textAlign: 'right', marginTop: 4 },
  delete: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  deleteText: { color: palette.danger, fontSize: typeScale.caption, fontWeight: fontWeight.bold },
  add: { minHeight: 58, borderRadius: radii.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(77,163,255,0.35)', backgroundColor: 'rgba(77,163,255,0.05)', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  addText: { color: palette.cyan, fontWeight: fontWeight.black },
  form: { marginTop: spacing.lg, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.lg, gap: spacing.sm },
  formTitle: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black, textAlign: 'right', marginBottom: spacing.sm },
  input: { minHeight: 54, borderRadius: radii.md, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(5,7,11,0.55)', color: palette.white, paddingHorizontal: spacing.md, fontSize: typeScale.bodySm },
  inputMultiline: { minHeight: 104, paddingTop: spacing.md, textAlignVertical: 'top' },
  inputCompact: { flex: 1 },
  split: { flexDirection: 'row', gap: spacing.sm },
  defaultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.md, paddingVertical: spacing.sm },
  defaultText: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold },
  error: { color: palette.danger, textAlign: 'right', fontSize: typeScale.caption },
  save: { minHeight: 54, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  saveText: { color: palette.ink, fontWeight: fontWeight.black },
  cancel: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: palette.textMuted, fontWeight: fontWeight.bold },
});

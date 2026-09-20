import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import {
  fontWeight,
  layout,
  palette,
  radii,
  shadow,
  spacing,
  typeScale,
} from '@/design';
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
  const { data, refresh } = useApiResource<Payload>(
    '/addresses',
    { addresses: [] },
  );

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
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
      await refresh();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : 'آدرس ذخیره نشد.',
      );
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    await apiRequest('/addresses/' + id, { method: 'DELETE' });
    invalidateResource('/addresses');
    void Haptics.selectionAsync();
    await refresh();
  };

  const addresses = data.addresses || [];
  const defaultAddress = addresses.find((item) => item.is_default);

  return (
    <Screen>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </PressableScale>

        <View style={styles.headerCopy}>
          <View style={styles.signalRow}>
            <View style={styles.signalDot} />
            <Text style={styles.eyebrow}>DELIVERY NODES</Text>
          </View>
          <Text style={styles.title}>آدرس‌ها</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}>
        <View style={styles.overview}>
          <View style={styles.overviewVisual}>
            <View style={styles.mapRingLarge}>
              <View style={styles.mapRingSmall}>
                <View style={styles.pin}>
                  <View style={styles.pinCore} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.overviewCopy}>
            <Text style={styles.overviewKicker}>DELIVERY NETWORK</Text>
            <Text style={styles.overviewTitle}>
              مقصدهای آماده برای سفارش
            </Text>
            <Text style={styles.overviewText}>
              {defaultAddress
                ? 'آدرس پیش‌فرضت آماده‌ست؛ هر زمان خواستی می‌تونی مقصد جدید اضافه کنی.'
                : 'یک مقصد پیش‌فرض بساز تا Checkout سریع‌تر جلو بره.'}
            </Text>
          </View>

          <View style={styles.addressCount}>
            <Text style={styles.addressCountValue}>
              {addresses.length.toLocaleString('fa-IR')}
            </Text>
            <Text style={styles.addressCountLabel}>SAVED</Text>
          </View>
        </View>

        <View style={styles.listHeading}>
          <View style={styles.listTitleRow}>
            <Text style={styles.listKicker}>YOUR PLACES</Text>
            <Text style={styles.listTitle}>مقصدهای ذخیره‌شده</Text>
          </View>

          {!showForm ? (
            <PressableScale
              onPress={() => setShowForm(true)}
              style={styles.addMini}>
              <Text style={styles.addMiniText}>+ جدید</Text>
            </PressableScale>
          ) : null}
        </View>

        <View style={styles.addressList}>
          {addresses.map((address, index) => (
            <View
              key={address.id}
              style={[
                styles.address,
                address.is_default && styles.addressDefault,
              ]}>
              <View
                style={[
                  styles.addressSignal,
                  {
                    backgroundColor: address.is_default
                      ? palette.cyan
                      : palette.textDim,
                  },
                ]}
              />

              <View style={styles.addressIndex}>
                <Text style={styles.addressIndexText}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>

              <View style={styles.addressCopy}>
                <View style={styles.addressTop}>
                  {address.is_default ? (
                    <View style={styles.defaultBadge}>
                      <View style={styles.defaultDot} />
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  ) : null}

                  <Text style={styles.addressTitle}>
                    {address.title}
                  </Text>
                </View>

                <Text style={styles.addressPerson}>
                  {address.recipient_name} · {address.phone}
                </Text>
                <Text numberOfLines={2} style={styles.addressText}>
                  تهران، {address.address_line}
                </Text>

                <View style={styles.addressFooter}>
                  <Text style={styles.addressCode}>
                    {address.postal_code
                      ? 'POST ' + address.postal_code
                      : 'TEHRAN NODE'}
                  </Text>

                  <PressableScale
                    haptic={false}
                    onPress={() => void remove(address.id)}
                    style={styles.deleteButton}>
                    <Text style={styles.deleteText}>حذف</Text>
                  </PressableScale>
                </View>
              </View>

              <View style={styles.addressIcon}>
                <Text style={styles.addressIconText}>⌂</Text>
              </View>
            </View>
          ))}
        </View>

        {!addresses.length && !showForm ? (
          <View style={styles.empty}>
            <View style={styles.emptyOrbit}>
              <View style={styles.emptyCore} />
            </View>
            <Text style={styles.emptyKicker}>NO DELIVERY NODE</Text>
            <Text style={styles.emptyTitle}>هنوز آدرسی نداری</Text>
            <Text style={styles.emptyText}>
              اولین مقصد رو بساز تا خریدهای بعدی چند لمس کوتاه‌تر بشن.
            </Text>
          </View>
        ) : null}

        {!showForm ? (
          <PressableScale
            style={styles.add}
            onPress={() => setShowForm(true)}>
            <View style={styles.addIcon}>
              <Text style={styles.addIconText}>+</Text>
            </View>
            <View style={styles.addCopy}>
              <Text style={styles.addKicker}>NEW DESTINATION</Text>
              <Text style={styles.addText}>اضافه کردن آدرس جدید</Text>
            </View>
            <View style={styles.addArrow} />
          </PressableScale>
        ) : (
          <View style={styles.form}>
            <View style={styles.formSignal} />

            <View style={styles.formHeading}>
              <Text style={styles.formKicker}>NEW DELIVERY NODE</Text>
              <Text style={styles.formTitle}>آدرس جدید</Text>
              <Text style={styles.formSubtitle}>
                فقط اطلاعات لازم برای تحویل سفارش رو وارد کن.
              </Text>
            </View>

            <FieldLabel label="عنوان آدرس" meta="LABEL" />
            <Field
              value={form.title}
              placeholder="مثلاً خانه"
              onChange={(value) =>
                setForm((prev) => ({ ...prev, title: value }))
              }
            />

            <FieldLabel label="تحویل‌گیرنده" meta="RECIPIENT" />
            <Field
              value={form.recipient_name}
              placeholder="نام و نام خانوادگی"
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  recipient_name: value,
                }))
              }
            />

            <FieldLabel label="شماره تماس" meta="MOBILE" />
            <Field
              value={form.phone}
              placeholder="09..."
              keyboard="phone-pad"
              onChange={(value) =>
                setForm((prev) => ({ ...prev, phone: value }))
              }
            />

            <FieldLabel label="نشانی کامل" meta="TEHRAN" />
            <Field
              value={form.address_line}
              placeholder="خیابان، کوچه، ساختمان…"
              multiline
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  address_line: value,
                }))
              }
            />

            <View style={styles.split}>
              <View style={styles.half}>
                <FieldLabel label="پلاک" />
                <Field
                  value={form.plaque}
                  placeholder="پلاک"
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      plaque: value,
                    }))
                  }
                />
              </View>

              <View style={styles.half}>
                <FieldLabel label="واحد" />
                <Field
                  value={form.unit}
                  placeholder="واحد"
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      unit: value,
                    }))
                  }
                />
              </View>
            </View>

            <FieldLabel label="کدپستی" meta="10 DIGITS" />
            <Field
              value={form.postal_code}
              placeholder="کدپستی ۱۰ رقمی"
              keyboard="number-pad"
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  postal_code: value,
                }))
              }
            />

            <View style={styles.defaultRow}>
              <Switch
                value={form.is_default}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    is_default: value,
                  }))
                }
                trackColor={{
                  false: palette.surfaceBright,
                  true: palette.blueHot,
                }}
                thumbColor={palette.white}
              />

              <View style={styles.defaultCopy}>
                <Text style={styles.defaultTitle}>
                  آدرس پیش‌فرض
                </Text>
                <Text style={styles.defaultText}>
                  Checkout بعدی با این آدرس شروع می‌شه.
                </Text>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PressableScale
              disabled={saving}
              style={styles.save}
              onPress={() => void save()}>
              <Text style={styles.saveText}>
                {saving ? 'در حال ذخیره…' : 'ذخیره مقصد'}
              </Text>
              {!saving ? <View style={styles.saveArrow} /> : null}
            </PressableScale>

            <PressableScale
              haptic={false}
              style={styles.cancel}
              onPress={() => {
                setShowForm(false);
                setError(null);
              }}>
              <Text style={styles.cancelText}>انصراف</Text>
            </PressableScale>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function FieldLabel({
  label,
  meta,
}: {
  label: string;
  meta?: string;
}) {
  return (
    <View style={styles.fieldHeading}>
      {meta ? <Text style={styles.fieldMeta}>{meta}</Text> : null}
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
  );
}

function Field({
  value,
  placeholder,
  onChange,
  multiline = false,
  keyboard,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  keyboard?: 'default' | 'phone-pad' | 'number-pad';
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
      style={[
        styles.input,
        multiline && styles.inputMultiline,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: palette.white,
    fontSize: 27,
    fontWeight: fontWeight.bold,
  },
  headerCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  signalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  signalDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: palette.cyan,
  },
  eyebrow: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  title: {
    color: palette.white,
    fontSize: typeScale.titleLg,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  scroll: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 90,
  },
  overview: {
    minHeight: 180,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    backgroundColor: 'rgba(10,16,26,0.78)',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadow.soft,
  },
  overviewVisual: {
    width: 100,
    alignItems: 'center',
  },
  mapRingLarge: {
    width: 90,
    height: 90,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapRingSmall: {
    width: 56,
    height: 56,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 26,
    height: 32,
    borderRadius: 13,
    borderBottomLeftRadius: 5,
    backgroundColor: 'rgba(88,244,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  pinCore: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '-45deg' }],
  },
  overviewCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  overviewKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  overviewTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    textAlign: 'right',
    marginTop: 4,
  },
  overviewText: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 5,
  },
  addressCount: {
    width: 56,
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCountValue: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
  },
  addressCountLabel: {
    color: palette.textDim,
    fontSize: 7,
    fontWeight: fontWeight.black,
    letterSpacing: 0.7,
    marginTop: 2,
  },
  listHeading: {
    marginTop: spacing.xxxl,
    marginBottom: spacing.md,
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  listTitleRow: {
    alignItems: 'flex-end',
  },
  listKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  listTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  addMini: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(88,244,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMiniText: {
    color: palette.cyan,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.black,
  },
  addressList: {
    gap: spacing.sm,
  },
  address: {
    minHeight: 134,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.026)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
  },
  addressDefault: {
    borderColor: 'rgba(88,244,255,0.24)',
    backgroundColor: 'rgba(88,244,255,0.05)',
  },
  addressSignal: {
    position: 'absolute',
    top: 0,
    right: 22,
    width: 48,
    height: 2,
  },
  addressIndex: {
    width: 30,
    alignItems: 'center',
  },
  addressIndexText: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
  },
  addressCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  addressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  defaultBadge: {
    height: 22,
    paddingHorizontal: 7,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(80,232,176,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(80,232,176,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  defaultDot: {
    width: 4,
    height: 4,
    borderRadius: 4,
    backgroundColor: palette.success,
  },
  defaultBadgeText: {
    color: palette.success,
    fontSize: 7,
    fontWeight: fontWeight.black,
  },
  addressTitle: {
    color: palette.white,
    fontSize: typeScale.body,
    fontWeight: fontWeight.black,
  },
  addressPerson: {
    color: palette.cyan,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
    marginTop: 5,
  },
  addressText: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 19,
    textAlign: 'right',
    marginTop: 3,
  },
  addressFooter: {
    width: '100%',
    marginTop: spacing.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressCode: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.6,
  },
  deleteButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  deleteText: {
    color: palette.danger,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  addressIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: 'rgba(88,244,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressIconText: {
    color: palette.cyan,
    fontSize: 19,
  },
  empty: {
    paddingVertical: 54,
    alignItems: 'center',
  },
  emptyOrbit: {
    width: 76,
    height: 76,
    borderRadius: 76,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCore: {
    width: 15,
    height: 15,
    borderRadius: 5,
    backgroundColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
  },
  emptyKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    color: palette.white,
    fontSize: typeScale.titleSm,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: typeScale.bodySm,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: spacing.sm,
  },
  add: {
    minHeight: 82,
    marginTop: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.16)',
    backgroundColor: 'rgba(88,244,255,0.04)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(88,244,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconText: {
    color: palette.cyan,
    fontSize: 25,
    fontWeight: fontWeight.regular,
  },
  addCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  addKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.9,
  },
  addText: {
    color: palette.white,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  addArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.3,
    borderBottomWidth: 1.3,
    borderColor: palette.cyan,
    transform: [{ rotate: '45deg' }],
    marginLeft: spacing.xs,
  },
  form: {
    marginTop: spacing.lg,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    backgroundColor: 'rgba(10,16,26,0.76)',
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: 'hidden',
    ...shadow.soft,
  },
  formSignal: {
    position: 'absolute',
    top: 0,
    right: 26,
    width: 58,
    height: 2,
    backgroundColor: palette.cyan,
  },
  formHeading: {
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  formKicker: {
    color: palette.cyan,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  formTitle: {
    color: palette.white,
    fontSize: typeScale.title,
    fontWeight: fontWeight.black,
    marginTop: 3,
  },
  formSubtitle: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    marginTop: 4,
    textAlign: 'right',
  },
  fieldHeading: {
    minHeight: 24,
    marginTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    color: palette.textMuted,
    fontSize: typeScale.caption,
    fontWeight: fontWeight.bold,
  },
  fieldMeta: {
    color: palette.textDim,
    fontSize: 8,
    fontWeight: fontWeight.black,
    letterSpacing: 0.7,
  },
  input: {
    minHeight: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(3,5,9,0.42)',
    color: palette.white,
    paddingHorizontal: spacing.md,
    fontSize: typeScale.bodySm,
  },
  inputMultiline: {
    minHeight: 106,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  split: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  defaultRow: {
    minHeight: 72,
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  defaultCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  defaultTitle: {
    color: palette.text,
    fontSize: typeScale.bodySm,
    fontWeight: fontWeight.black,
  },
  defaultText: {
    color: palette.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'right',
  },
  error: {
    color: palette.danger,
    textAlign: 'right',
    fontSize: typeScale.caption,
    marginTop: spacing.xs,
  },
  save: {
    minHeight: 56,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  saveText: {
    color: palette.ink,
    fontWeight: fontWeight.black,
  },
  saveArrow: {
    width: 7,
    height: 7,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: palette.ink,
    transform: [{ rotate: '45deg' }],
  },
  cancel: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: palette.textMuted,
    fontWeight: fontWeight.bold,
  },
});

import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/ui/page-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { fontFamily, fontWeight, layout, palette, radii, spacing, typeScale } from '@/design';
import { apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';
import type { ProfilePayload } from '@/types/api';

type Profile = ProfilePayload['profile'] & {
  birth_date?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  has_password?: boolean;
};

export default function EditAccountScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatar, setAvatar] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void apiRequest<ProfilePayload>('/me').then((result) => {
      const next = result.profile as Profile;
      setProfile(next);
      setName(next.name || '');
      setPhone(next.phone || '');
      setBirthDate(next.birth_date || '');
    });
  }, []);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (result.canceled) return;
    const item = result.assets[0];
    setAvatar({
      uri: item.uri,
      name: item.fileName || 'playnexus-avatar.jpg',
      type: item.mimeType || 'image/jpeg',
    });
    setRemoveAvatar(false);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('phone', phone.trim());
      if (birthDate.trim()) form.append('birth_date', birthDate.trim());
      if (removeAvatar) form.append('remove_avatar', '1');
      if (avatar) {
        form.append('avatar', {
          uri: avatar.uri,
          name: avatar.name,
          type: avatar.type,
        } as never);
      }

      const result = await apiRequest<{ message: string; profile: Profile }>(
        '/me',
        { method: 'PATCH', body: form },
        { timeoutMs: 60_000 },
      );
      setProfile(result.profile);
      setAvatar(null);
      invalidateResource('/me');
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ذخیره پروفایل انجام نشد.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <PageHeader title="Edit Player ID" subtitle="ACCOUNT PROFILE" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarPanel}>
          <View style={styles.avatarShell}>
            <Image
              source={avatar?.uri ? { uri: avatar.uri } : profile?.avatar_url ? { uri: String(profile.avatar_url) } : require('../../../assets/images/logo.png')}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>
          <View style={styles.avatarCopy}>
            <Text style={styles.kicker}>PLAYER AVATAR</Text>
            <Text style={styles.avatarTitle}>هویت تصویری حساب</Text>
            <View style={styles.avatarActions}>
              <PressableScale style={styles.smallButton} onPress={() => void pickAvatar()}>
                <Text style={styles.smallButtonText}>انتخاب عکس</Text>
              </PressableScale>
              <PressableScale
                style={styles.ghostButton}
                onPress={() => {
                  setAvatar(null);
                  setRemoveAvatar(true);
                }}>
                <Text style={styles.ghostText}>حذف</Text>
              </PressableScale>
            </View>
          </View>
        </View>

        <Field label="نام نمایشی" value={name} onChangeText={setName} placeholder="نام شما" />
        <Field label="شماره موبایل" value={phone} onChangeText={setPhone} placeholder="09xxxxxxxxx" keyboardType="phone-pad" />
        <Field label="تاریخ تولد" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <PressableScale disabled={saving} onPress={() => void save()} style={styles.primary}>
          <Text style={styles.primaryText}>{saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</Text>
        </PressableScale>

        <PressableScale haptic={false} onPress={() => router.back()} style={styles.cancel}>
          <Text style={styles.cancelText}>انصراف</Text>
        </PressableScale>
      </ScrollView>
    </Screen>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={palette.textDim}
        textAlign="right"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenPadding, paddingBottom: 80, gap: spacing.md },
  avatarPanel: { minHeight: 132, borderRadius: radii.xl, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', padding: spacing.md, flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  avatarShell: { width: 86, height: 86, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(88,244,255,0.22)' },
  avatar: { flex: 1 },
  avatarCopy: { flex: 1, alignItems: 'flex-end' },
  kicker: { color: palette.cyan, fontFamily: fontFamily.black, fontSize: 8, letterSpacing: 1 },
  avatarTitle: { color: palette.white, fontFamily: fontFamily.black, fontSize: typeScale.body, marginTop: 4 },
  avatarActions: { flexDirection: 'row-reverse', gap: spacing.xs, marginTop: spacing.md },
  smallButton: { minHeight: 38, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: palette.white, justifyContent: 'center' },
  smallButtonText: { color: palette.ink, fontFamily: fontFamily.black, fontSize: 11 },
  ghostButton: { minHeight: 38, paddingHorizontal: spacing.md, justifyContent: 'center' },
  ghostText: { color: palette.danger, fontFamily: fontFamily.bold, fontSize: 11 },
  field: { gap: spacing.xs },
  label: { color: palette.textMuted, fontFamily: fontFamily.bold, textAlign: 'right', fontSize: typeScale.caption },
  input: { minHeight: 58, borderRadius: radii.lg, borderWidth: 1, borderColor: palette.line, backgroundColor: 'rgba(255,255,255,0.03)', color: palette.white, paddingHorizontal: spacing.md, fontFamily: fontFamily.regular },
  message: { color: palette.warning, fontFamily: fontFamily.regular, textAlign: 'right' },
  primary: { minHeight: 58, borderRadius: radii.lg, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  primaryText: { color: palette.ink, fontFamily: fontFamily.black },
  cancel: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: palette.textMuted, fontFamily: fontFamily.bold },
});

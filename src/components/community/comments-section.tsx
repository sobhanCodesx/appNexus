import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { fontWeight, palette, radii, spacing, typeScale } from '@/design';
import { useApiResource } from '@/hooks/use-api-resource';
import { ApiError, apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';
import type { Paginated } from '@/types/api';

type Comment = {
  id: number;
  body: string;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
  can_delete: boolean;
  user: {
    name: string;
    avatar_url?: string | null;
  };
  replies?: Comment[];
};

export function CommentsSection({ slug, enabled = true }: { slug: string; enabled?: boolean }) {
  const path = '/contents/' + encodeURIComponent(slug) + '/comments';
  const { data, refresh } = useApiResource<Paginated<Comment>>(path, { data: [] }, 15_000);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  if (!enabled) return null;

  const requireAuth = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      router.push('/auth/login');
      return true;
    }
    return false;
  };

  const send = async () => {
    const value = body.trim();
    if (!value) return;
    setSending(true);

    try {
      await apiRequest(
        '/contents/' + encodeURIComponent(slug) + '/comments',
        { method: 'POST', body: JSON.stringify({ body: value }) },
      );
      setBody('');
      invalidateResource(path);
      await refresh();
    } catch (error) {
      requireAuth(error);
    } finally {
      setSending(false);
    }
  };

  const like = async (comment: Comment) => {
    try {
      await apiRequest('/comments/' + comment.id + '/like', { method: 'POST' });
      invalidateResource(path);
      await refresh();
    } catch (error) {
      requireAuth(error);
    }
  };

  const remove = async (comment: Comment) => {
    try {
      await apiRequest('/comments/' + comment.id, { method: 'DELETE' });
      invalidateResource(path);
      await refresh();
    } catch (error) {
      requireAuth(error);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.count}>{(data.total ?? data.data.length).toLocaleString('fa-IR')}</Text>
        <Text style={styles.title}>گفتگو</Text>
      </View>

      <View style={styles.composer}>
        <PressableScale disabled={sending} onPress={() => void send()} style={styles.send}>
          <Text style={styles.sendText}>{sending ? '…' : 'ارسال'}</Text>
        </PressableScale>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="نظرت درباره این چیه؟"
          placeholderTextColor={palette.textDim}
          textAlign="right"
          style={styles.input}
        />
      </View>

      <View style={styles.list}>
        {data.data.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onLike={() => void like(comment)}
            onDelete={comment.can_delete ? () => void remove(comment) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

function CommentItem({
  comment,
  onLike,
  onDelete,
  nested = false,
}: {
  comment: Comment;
  onLike: () => void;
  onDelete?: () => void;
  nested?: boolean;
}) {
  return (
    <View style={[styles.comment, nested && styles.reply]}>
      <View style={styles.commentTop}>
        <View style={styles.commentCopy}>
          <Text style={styles.userName}>{comment.user.name}</Text>
          <Text style={styles.date}>{new Date(comment.created_at).toLocaleDateString('fa-IR')}</Text>
        </View>
        <Image
          source={comment.user.avatar_url
            ? { uri: comment.user.avatar_url }
            : require('../../../assets/images/logo.png')}
          style={styles.avatar}
          contentFit="cover"
        />
      </View>

      <Text style={styles.body}>{comment.body}</Text>

      <View style={styles.actions}>
        {onDelete ? (
          <PressableScale haptic={false} onPress={onDelete} style={styles.smallAction}>
            <Text style={styles.delete}>حذف</Text>
          </PressableScale>
        ) : null}
        <PressableScale haptic onPress={onLike} style={styles.smallAction}>
          <Text style={[styles.like, comment.is_liked && styles.likeActive]}>
            {comment.likes_count.toLocaleString('fa-IR')} ♥
          </Text>
        </PressableScale>
      </View>

      {(comment.replies || []).map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onLike={() => undefined}
          nested
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  count: { color: palette.textDim, fontSize: typeScale.caption },
  title: { color: palette.white, fontSize: typeScale.title, fontWeight: fontWeight.black },
  composer: {
    minHeight: 72,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.035)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    color: palette.text,
    fontSize: typeScale.bodySm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  send: {
    minWidth: 58,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: palette.ink, fontWeight: fontWeight.black, fontSize: typeScale.caption },
  list: { gap: spacing.sm, marginTop: spacing.md },
  comment: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: 'rgba(255,255,255,0.025)',
    padding: spacing.md,
  },
  reply: {
    marginTop: spacing.sm,
    marginLeft: spacing.lg,
    backgroundColor: 'rgba(77,163,255,0.035)',
  },
  commentTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commentCopy: { alignItems: 'flex-end' },
  avatar: { width: 38, height: 38, borderRadius: 13, backgroundColor: palette.surface },
  userName: { color: palette.text, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold },
  date: { color: palette.textDim, fontSize: 9, marginTop: 2 },
  body: {
    color: '#D7DDE6',
    fontSize: typeScale.bodySm,
    lineHeight: 23,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  smallAction: { paddingHorizontal: spacing.xs, paddingVertical: 4 },
  like: { color: palette.textMuted, fontSize: typeScale.caption, fontWeight: fontWeight.bold },
  likeActive: { color: palette.cyan },
  delete: { color: palette.danger, fontSize: typeScale.caption, fontWeight: fontWeight.bold },
});

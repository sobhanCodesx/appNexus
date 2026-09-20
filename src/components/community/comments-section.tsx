import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { PressableScale } from '@/components/ui/pressable-scale';
import { fontFamily, fontWeight, palette, radii, spacing, typeScale } from '@/design';
import { usePaginatedResource } from '@/hooks/use-paginated-resource';
import { ApiError, apiRequest } from '@/services/api';
import { invalidateResource } from '@/services/resource-cache';

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
  const [sort, setSort] = useState<'popular' | 'newest'>('popular');
  const basePath = '/contents/' + encodeURIComponent(slug) + '/comments';
  const path = basePath + '?sort=' + sort;
  const {
    data,
    items,
    refresh,
    hasMore,
    loadMore,
    loadingMore,
  } = usePaginatedResource<Comment>(path, 15_000);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
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
      await apiRequest(basePath, {
        method: 'POST',
        body: JSON.stringify({
          body: value,
          parent_id: replyTo?.id ?? null,
        }),
      });
      setBody('');
      setReplyTo(null);
      invalidateResource(basePath);
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
      invalidateResource(basePath);
      invalidateResource(path);
      await refresh();
    } catch (error) {
      requireAuth(error);
    }
  };

  const remove = async (comment: Comment) => {
    try {
      await apiRequest('/comments/' + comment.id, { method: 'DELETE' });
      invalidateResource(basePath);
      invalidateResource(path);
      await refresh();
    } catch (error) {
      requireAuth(error);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.sortRow}>
          <Chip label="محبوب" active={sort === 'popular'} onPress={() => setSort('popular')} />
          <Chip label="جدیدترین" active={sort === 'newest'} onPress={() => setSort('newest')} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.count}>{(data.total ?? items.length).toLocaleString('fa-IR')}</Text>
          <Text style={styles.title}>گفتگو</Text>
        </View>
      </View>

      {replyTo ? (
        <View style={styles.replyingTo}>
          <PressableScale haptic={false} onPress={() => setReplyTo(null)}>
            <Text style={styles.cancelReply}>×</Text>
          </PressableScale>
          <Text style={styles.replyingText}>پاسخ به {replyTo.user.name}</Text>
        </View>
      ) : null}

      <View style={styles.composer}>
        <PressableScale disabled={sending} onPress={() => void send()} style={styles.send}>
          <Text style={styles.sendText}>{sending ? '…' : replyTo ? 'پاسخ' : 'ارسال'}</Text>
        </PressableScale>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          placeholder={replyTo ? 'پاسخت رو بنویس…' : 'نظرت درباره این چیه؟'}
          placeholderTextColor={palette.textDim}
          textAlign="right"
          style={styles.input}
        />
      </View>

      <View style={styles.list}>
        {items.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onLike={like}
            onDelete={remove}
            onReply={setReplyTo}
          />
        ))}
      </View>

      {hasMore ? (
        <PressableScale
          disabled={loadingMore}
          onPress={() => void loadMore()}
          style={styles.more}>
          <Text style={styles.moreText}>
            {loadingMore ? 'در حال دریافت…' : 'گفتگوهای بیشتر'}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

function CommentItem({
  comment,
  onLike,
  onDelete,
  onReply,
  nested = false,
}: {
  comment: Comment;
  onLike: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  onReply: (comment: Comment) => void;
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
          cachePolicy="memory-disk"
        />
      </View>

      <Text style={styles.body}>{comment.body}</Text>

      <View style={styles.actions}>
        {comment.can_delete ? (
          <PressableScale haptic={false} onPress={() => onDelete(comment)} style={styles.smallAction}>
            <Text style={styles.delete}>حذف</Text>
          </PressableScale>
        ) : null}
        <PressableScale haptic={false} onPress={() => onReply(comment)} style={styles.smallAction}>
          <Text style={styles.replyAction}>پاسخ</Text>
        </PressableScale>
        <PressableScale haptic onPress={() => onLike(comment)} style={styles.smallAction}>
          <Text style={[styles.like, comment.is_liked && styles.likeActive]}>
            {comment.likes_count.toLocaleString('fa-IR')} ♥
          </Text>
        </PressableScale>
      </View>

      {(comment.replies || []).map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          onLike={onLike}
          onDelete={onDelete}
          onReply={onReply}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sortRow: { flexDirection: 'row', gap: spacing.xs },
  titleWrap: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  count: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: typeScale.caption },
  title: { color: palette.white, fontFamily: fontFamily.black, fontSize: typeScale.title, fontWeight: fontWeight.black },
  replyingTo: {
    minHeight: 38,
    marginBottom: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: 'rgba(88,244,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.12)',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyingText: { color: palette.cyan, fontFamily: fontFamily.bold, fontSize: 10 },
  cancelReply: { color: palette.textMuted, fontSize: 20 },
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
    fontFamily: fontFamily.regular,
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
  sendText: { color: palette.ink, fontFamily: fontFamily.black, fontWeight: fontWeight.black, fontSize: typeScale.caption },
  list: { gap: spacing.sm, marginTop: spacing.md },
  more: {
    minHeight: 46,
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(88,244,255,0.14)',
    backgroundColor: 'rgba(88,244,255,0.045)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: palette.cyan,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: typeScale.caption,
  },
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
  userName: { color: palette.text, fontFamily: fontFamily.bold, fontSize: typeScale.bodySm, fontWeight: fontWeight.bold },
  date: { color: palette.textDim, fontFamily: fontFamily.regular, fontSize: 9, marginTop: 2 },
  body: {
    color: '#D7DDE6',
    fontFamily: fontFamily.regular,
    fontSize: typeScale.bodySm,
    lineHeight: 23,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  smallAction: { paddingHorizontal: spacing.xs, paddingVertical: 4 },
  like: { color: palette.textMuted, fontFamily: fontFamily.bold, fontSize: typeScale.caption, fontWeight: fontWeight.bold },
  likeActive: { color: palette.cyan },
  replyAction: { color: palette.cyan, fontFamily: fontFamily.bold, fontSize: typeScale.caption },
  delete: { color: palette.danger, fontFamily: fontFamily.bold, fontSize: typeScale.caption, fontWeight: fontWeight.bold },
});

const entities: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&lt;': '<',
  '&gt;': '>',
};

function decodeEntities(value: string) {
  return Object.entries(entities)
    .reduce((text, [entity, decoded]) => text.replaceAll(entity, decoded), value);
}

function cleanInlineHtml(value: string) {
  return decodeEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
}

export type RichTextBlock = {
  type: 'h1' | 'h2' | 'h3' | 'paragraph' | 'list-item' | 'quote';
  text: string;
};

export function htmlToPlainText(value?: string | null) {
  if (!value) return '';

  return decodeEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Lightweight native editorial parser.
 * It intentionally keeps the mobile bundle free of a WebView/HTML renderer
 * while preserving the hierarchy authors created in the PlayNexus editor.
 */
export function htmlToRichBlocks(value?: string | null): RichTextBlock[] {
  if (!value) return [];

  const blocks: RichTextBlock[] = [];
  const pattern = /<(h1|h2|h3|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    const text = cleanInlineHtml(match[2]);
    if (!text) continue;

    const type: RichTextBlock['type'] = match[1].toLowerCase() === 'p'
      ? 'paragraph'
      : match[1].toLowerCase() === 'li'
        ? 'list-item'
        : match[1].toLowerCase() === 'blockquote'
          ? 'quote'
          : match[1].toLowerCase() as 'h1' | 'h2' | 'h3';

    blocks.push({ type, text });
  }

  if (blocks.length) return blocks;

  return htmlToPlainText(value)
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ type: 'paragraph' as const, text }));
}

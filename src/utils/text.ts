const entities: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&lt;': '<',
  '&gt;': '>',
};

export function htmlToPlainText(value?: string | null) {
  if (!value) return '';

  return Object.entries(entities)
    .reduce((text, [entity, decoded]) => text.replaceAll(entity, decoded), value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

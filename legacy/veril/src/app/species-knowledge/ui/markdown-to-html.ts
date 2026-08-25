import { marked } from 'marked';

export function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  if (typeof html !== 'string') {
    throw new Error('Markdown rendering must be synchronous');
  }
  return html;
}

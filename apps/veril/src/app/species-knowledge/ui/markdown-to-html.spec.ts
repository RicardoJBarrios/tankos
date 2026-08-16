import { describe, expect, it } from 'vitest';
import { markdownToHtml } from './markdown-to-html';

describe('markdownToHtml', () => {
  it('converts editorial Markdown to HTML', () => {
    expect(markdownToHtml('**Resumen**')).toContain('<strong>Resumen</strong>');
  });
});

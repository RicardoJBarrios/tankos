import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, pageSizeFor } from './pagination';

describe('pagination', () => {
  it('uses the default page size when no request is provided', () => {
    expect(pageSizeFor()).toBe(DEFAULT_PAGE_SIZE);
  });

  it('clamps requested sizes to the supported maximum', () => {
    expect(pageSizeFor({ pageSize: MAX_PAGE_SIZE + 10 })).toBe(MAX_PAGE_SIZE);
  });

  it('falls back to the default for invalid sizes', () => {
    expect(pageSizeFor({ pageSize: 0 })).toBe(DEFAULT_PAGE_SIZE);
    expect(pageSizeFor({ pageSize: 1.5 })).toBe(DEFAULT_PAGE_SIZE);
  });
});

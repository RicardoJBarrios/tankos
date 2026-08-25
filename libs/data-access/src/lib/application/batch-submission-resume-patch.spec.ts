import { describe, expect, it } from 'vitest';
import { createResumePatch } from './batch-submission-resume-patch';

describe('createResumePatch', () => {
  it('Given an update timestamp, When creating a resume patch, Then queues the batch', () => {
    const now = { kind: 'instant' as const, epochMilliseconds: 0 };
    expect(createResumePatch(now)).toEqual({ status: 'queued', updatedAt: now });
  });
});

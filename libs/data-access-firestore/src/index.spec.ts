import { describe, expect, it } from 'vitest';
import {
  createFirestoreCrudRepository,
  createFirestoreRecordSchema,
} from './index';

describe('Firestore public entry point', () => {
  it('Given the Firestore entry point, When imported, Then exposes its repository factory', () => {
    expect(createFirestoreCrudRepository).toBeTypeOf('function');
    expect(createFirestoreRecordSchema).toBeTypeOf('function');
  });
});

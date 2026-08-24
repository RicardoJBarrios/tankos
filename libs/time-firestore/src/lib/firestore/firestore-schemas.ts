import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

/** Runtime schema for a client Firestore timestamp. */
export const firestoreTimestampSchema = z.custom<Timestamp>(
  (value) => value instanceof Timestamp,
  { message: 'Expected a Firestore Timestamp' },
);

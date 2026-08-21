import { z } from 'zod';

/** Runtime schema for date strings received through JSON or HTTP. */
export const jsonHttpDateStringSchema = z.string();

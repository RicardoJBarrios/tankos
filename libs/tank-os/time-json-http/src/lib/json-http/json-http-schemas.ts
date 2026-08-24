import { z } from 'zod';

/** Runtime schema for date strings received through JSON or HTTP. */
export const jsonHttpDateStringSchema = z.string();

/** Runtime schema for an ISO 8601 duration string received over JSON/HTTP. */
export const jsonHttpDurationStringSchema = z.string();

import { ClockPort } from '../../core';

/** Creates a clock backed by the JavaScript runtime clock. */
export function createNativeClock(): ClockPort {
  return {
    now: () => ({ kind: 'instant', epochMilliseconds: Date.now() }),
  };
}

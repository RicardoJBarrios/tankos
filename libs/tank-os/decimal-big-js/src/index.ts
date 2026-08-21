export * from './lib/big-js';

import type { Provider } from '@angular/core';
import { provideTankOsDecimal } from '@tank-os/decimal';
import { createBigJsDecimalAdapter } from './lib/big-js';

/** Registers the Decimal port with the Big.js adapter in Angular. */
export function provideTankOsDecimalWithBigJs(): Provider[] {
  return provideTankOsDecimal(createBigJsDecimalAdapter());
}

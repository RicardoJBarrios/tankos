import type { Provider } from '@angular/core';
import { createBigJsDecimalAdapter } from './lib/decimal/adapters/big-js';
import { provideTankOsDecimal } from './lib/decimal/composition';

/** Creates the concrete Big.js arithmetic adapter. */
export { createBigJsDecimalAdapter } from './lib/decimal/adapters/big-js';

/** Registers Decimal with the Big.js implementation. */
export function provideTankOsDecimalWithBigJs(): Provider[] {
  return provideTankOsDecimal(createBigJsDecimalAdapter());
}

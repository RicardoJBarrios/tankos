import type { Provider } from '@angular/core';
import {
  createBigJsDecimalAdapter,
  provideTankOsDecimal,
} from '@tank-os/decimal';

/** Creates the concrete Big.js arithmetic adapter. */
export { createBigJsDecimalAdapter } from '@tank-os/decimal';

/** Registers Decimal with the Big.js implementation. */
export function provideTankOsDecimalWithBigJs(): Provider[] {
  return provideTankOsDecimal(createBigJsDecimalAdapter());
}

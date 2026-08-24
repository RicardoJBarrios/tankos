/** Opaque semantic category kept separate from physical dimensions. */
export type QuantityKind = string & { readonly __quantityKind: unique symbol };

/** Creates a non-empty semantic quantity category. */
export function createQuantityKind(value: string): QuantityKind {
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    value !== value.trim()
  ) {
    throw new TypeError('QuantityKind must be a non-empty trimmed string');
  }

  return value as QuantityKind;
}

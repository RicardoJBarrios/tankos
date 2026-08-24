/**
 * Left-pads text to a minimum width.
 *
 * @param value - Text to pad.
 * @param width - Minimum resulting width. Must be a non-negative integer.
 * @param fillCharacter - One character used for padding.
 * @returns The padded text, or the original text when it already meets the width.
 * @throws RangeError when the width or fill character is invalid.
 */
export function padLeft(
  value: string,
  width: number,
  fillCharacter = '0',
): string {
  if (!Number.isInteger(width) || width < 0) {
    throw new RangeError('Padding width must be a non-negative integer');
  }
  if ([...fillCharacter].length !== 1) {
    throw new RangeError(
      'Padding character must contain exactly one character',
    );
  }
  return value.padStart(width, fillCharacter);
}

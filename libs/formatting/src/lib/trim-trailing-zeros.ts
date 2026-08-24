/**
 * Removes ASCII zero characters from the end of a formatted numeric string.
 *
 * The function does not parse or otherwise normalize the input. It preserves
 * every character before the trailing zero run, including whitespace, signs,
 * decimal separators and Unicode characters.
 *
 * @param value - Formatted text whose trailing ASCII zeros should be removed.
 * @returns The input without its trailing ASCII zeros.
 */
export function trimTrailingZeros(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 48) {
    end -= 1;
  }
  return value.slice(0, end);
}

const KNOWN_PADS: ReadonlyArray<readonly [RegExp, string]> = [
  [/dualsense|0ce6/i, 'DualSense'],
  [/dualshock|054c/i, 'DualShock'],
  [/xbox|xinput|045e/i, 'Xbox'],
  [/pro controller|057e/i, 'Switch Pro'],
  [/8bitdo|2dc8/i, '8BitDo'],
  [/stadia/i, 'Stadia'],
];

export const MAX_PAD_NAME = 24;

export const FALLBACK_PAD_NAME = 'Gamepad';

/** Short display name for a raw `Gamepad.id`: a known brand, else its leading text cut to 24 chars. */
export function shortPadName(id: string, fallback: string = FALLBACK_PAD_NAME): string {
  const known = KNOWN_PADS.find(([pattern]) => pattern.test(id));
  if (known !== undefined) {
    return known[1];
  }
  const base = id
    .replace(/\(.*$/, '')
    .replace(/^[0-9a-f]{4}-[0-9a-f]{4}-/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (base === '') {
    return fallback;
  }
  return base.length > MAX_PAD_NAME ? `${base.slice(0, MAX_PAD_NAME - 1).trimEnd()}…` : base;
}

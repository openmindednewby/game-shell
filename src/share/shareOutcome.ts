export const SHARE_OUTCOME = {
  Shared: 'shared',
  Copied: 'copied',
  Cancelled: 'cancelled',
  Failed: 'failed',
} as const;

export type ShareOutcome = (typeof SHARE_OUTCOME)[keyof typeof SHARE_OUTCOME];

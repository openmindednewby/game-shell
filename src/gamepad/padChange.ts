export const PAD_CHANGE = {
  Initial: 'initial',
  Connected: 'connected',
  Disconnected: 'disconnected',
} as const;

export type PadChangeKind = (typeof PAD_CHANGE)[keyof typeof PAD_CHANGE];

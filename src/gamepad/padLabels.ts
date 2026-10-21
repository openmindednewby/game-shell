export interface PadLabels {
  connected: string;
  disconnected: string;
  playerConnected: string;
  playerDisconnected: string;
  badgeOne: string;
  badgeMany: string;
  player: string;
}

/** English defaults. Tokens: `{name}` short pad name, `{slot}` player number, `{count}` pads connected. */
export const DEFAULT_PAD_LABELS: PadLabels = {
  connected: 'Controller connected: {name}',
  disconnected: 'Controller disconnected: {name}',
  playerConnected: 'P{slot} controller connected: {name}',
  playerDisconnected: 'P{slot} controller disconnected: {name}',
  badgeOne: 'Controller connected: {name}',
  badgeMany: '{count} controllers connected',
  player: 'P{slot}',
};

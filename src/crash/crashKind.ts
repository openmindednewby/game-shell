export const CRASH_KIND = {
  Error: 'error',
  Rejection: 'rejection',
} as const;

export type CrashKind = (typeof CRASH_KIND)[keyof typeof CRASH_KIND];

export interface CrashInfo {
  kind: CrashKind;
  message: string;
  source?: string;
}

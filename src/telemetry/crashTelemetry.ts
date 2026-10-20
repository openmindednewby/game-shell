import type { Disposable } from '../types';
import type { CrashInfo } from '../crash/crashKind';
import { fromErrorEvent, fromRejection, isErrorEvent, isOwnError, originOf } from '../crash/crash';

export const DEFAULT_CRASH_EVENT = 'crash';
export const DEFAULT_MAX_CRASH_EVENTS = 5;
export const DEFAULT_MAX_CRASH_TEXT = 200;
const REF_RADIX = 36;

export interface UmamiTracker {
  track(event: string, data?: Record<string, string>): void;
}

export interface CrashTelemetryWindow extends Window {
  umami?: UmamiTracker;
}

export interface CrashTelemetryOptions {
  win?: CrashTelemetryWindow;
  event?: string;
  appVersion?: string;
  maxEvents?: number;
  maxText?: number;
  origins?: string[];
  listen?: boolean;
  now?: () => number;
}

export interface CrashTelemetry extends Disposable {
  report(info: CrashInfo): string | undefined;
}

function payload(info: CrashInfo, ref: string, maxText: number, appVersion?: string): Record<string, string> {
  const data: Record<string, string> = { kind: info.kind, message: info.message.slice(0, maxText), ref };
  if (info.source !== undefined && info.source !== '') {
    data.source = info.source.slice(0, maxText);
  }
  if (appVersion !== undefined && appVersion !== '') {
    data.version = appVersion;
  }
  return data;
}

function safeTrack(win: CrashTelemetryWindow, event: string, data: Record<string, string>): void {
  try {
    win.umami?.track(event, data);
  } catch {
    return;
  }
}

/** Sends own-origin errors and unhandled rejections to Umami once each, capped per page; a missing or failing tracker is ignored. */
export function installCrashTelemetry(opts: CrashTelemetryOptions = {}): CrashTelemetry {
  const win = opts.win ?? window;
  const event = opts.event ?? DEFAULT_CRASH_EVENT;
  const maxEvents = opts.maxEvents ?? DEFAULT_MAX_CRASH_EVENTS;
  const maxText = opts.maxText ?? DEFAULT_MAX_CRASH_TEXT;
  const now = opts.now ?? Date.now;
  const allowed = new Set([win.location.origin, ...(opts.origins ?? []).map((o) => originOf(o) ?? o)]);
  const sent = new Map<string, string>();

  const report = (info: CrashInfo): string | undefined => {
    const key = `${info.kind}:${info.message}`;
    const seen = sent.get(key);
    if (seen !== undefined) {
      return seen;
    }
    if (sent.size >= maxEvents) {
      return undefined;
    }
    const ref = now().toString(REF_RADIX);
    sent.set(key, ref);
    safeTrack(win, event, payload(info, ref, maxText, opts.appVersion));
    return ref;
  };
  const onError = (e: Event): void => {
    if (isErrorEvent(e) && isOwnError(e, allowed)) {
      report(fromErrorEvent(e));
    }
  };
  const onRejection = (e: Event): void => {
    report(fromRejection(e));
  };

  const listen = opts.listen ?? true;
  if (listen) {
    win.addEventListener('error', onError);
    win.addEventListener('unhandledrejection', onRejection);
  }
  return {
    report,
    dispose: (): void => {
      win.removeEventListener('error', onError);
      win.removeEventListener('unhandledrejection', onRejection);
    },
  };
}

import type { CrashLabels, Disposable } from '../types';
import { CRASH_KIND, type CrashInfo } from './crashKind';
import { renderCrashOverlay } from './crashOverlay';

export interface CrashOptions {
  labels: CrashLabels;
  report?: (info: CrashInfo) => string | void;
  appVersion?: string;
  win?: Window;
  reload?: () => void;
}

function fromErrorEvent(e: ErrorEvent): CrashInfo {
  const err: unknown = e.error;
  const stack = err instanceof Error ? err.stack : undefined;
  const location = e.filename !== '' ? `${e.filename}:${e.lineno}:${e.colno}` : undefined;
  const message = e.message !== '' ? e.message : String(err);
  return { kind: CRASH_KIND.Error, message, source: stack ?? location };
}

function fromRejection(e: Event): CrashInfo {
  const reason: unknown = (e as PromiseRejectionEvent).reason;
  if (reason instanceof Error) {
    return { kind: CRASH_KIND.Rejection, message: reason.message, source: reason.stack };
  }
  return { kind: CRASH_KIND.Rejection, message: String(reason) };
}

function isErrorEvent(e: Event): e is ErrorEvent {
  return typeof (e as Partial<ErrorEvent>).message === 'string';
}

function safeReport(opts: CrashOptions, info: CrashInfo): string | undefined {
  try {
    return opts.report?.(info) ?? undefined;
  } catch {
    return undefined;
  }
}

function copyDetails(win: Window, info: CrashInfo, appVersion?: string): void {
  const text = [info.message, info.source, appVersion]
    .filter((part): part is string => part !== undefined && part !== '')
    .join('\n');
  try {
    win.navigator.clipboard.writeText(text).catch(() => undefined);
  } catch {
    // No clipboard API (insecure context): nothing to copy into.
  }
}

export function startCrash(opts: CrashOptions): Disposable {
  const win = opts.win ?? window;
  const reload = opts.reload ?? ((): void => win.location.reload());
  let overlay: HTMLElement | null = null;

  const handle = (info: CrashInfo): void => {
    const reference = safeReport(opts, info);
    if (overlay) {
      return;
    }
    const view = renderCrashOverlay({
      doc: win.document,
      labels: opts.labels,
      reference,
      onReload: reload,
      onCopy: () => copyDetails(win, info, opts.appVersion),
    });
    overlay = view.root;
    win.document.body.append(overlay);
    view.reload.focus();
  };
  const onError = (e: Event): void => {
    if (isErrorEvent(e)) {
      handle(fromErrorEvent(e));
    }
  };
  const onRejection = (e: Event): void => handle(fromRejection(e));

  win.addEventListener('error', onError);
  win.addEventListener('unhandledrejection', onRejection);
  return {
    dispose: (): void => {
      win.removeEventListener('error', onError);
      win.removeEventListener('unhandledrejection', onRejection);
      overlay?.remove();
      overlay = null;
    },
  };
}

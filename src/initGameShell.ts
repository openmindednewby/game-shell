import { startCrash } from './crash/crash';
import type { CrashInfo } from './crash/crashKind';
import { startFit } from './fit/fit';
import { startInstall } from './install/install';
import { startLifecycle, type LifecycleOptions } from './lifecycle/lifecycle';
import { injectStyles } from './styles';
import type { Disposable, GameShellLabels } from './types';
import { startVersionPoll } from './version/versionPoll';

export interface GameShellOptions {
  root: HTMLElement;
  appName: string;
  labels: GameShellLabels;
  appVersion?: string;
  install?: { snoozeDays?: number; storageKey?: string } | false;
  version?: { url: string; intervalMs: number; onNewVersion(): void };
  crash?: { report?(info: CrashInfo): string | void } | false;
  lifecycle?: LifecycleOptions;
}

export function initGameShell(opts: GameShellOptions): Disposable {
  const doc = opts.root.ownerDocument;
  injectStyles(doc);
  opts.root.classList.add('gs-root');
  const parts: Disposable[] = [startFit()];
  if (opts.install !== false) {
    parts.push(startInstall({ appName: opts.appName, labels: opts.labels, ...opts.install }));
  }
  if (opts.crash !== false) {
    parts.push(startCrash({ labels: opts.labels, report: opts.crash?.report, appVersion: opts.appVersion }));
  }
  if (opts.lifecycle) {
    parts.push(startLifecycle(opts.lifecycle, doc));
  }
  if (opts.version) {
    parts.push(startVersionPoll(opts.version));
  }
  return {
    dispose: (): void => {
      parts.forEach((part) => part.dispose());
      opts.root.classList.remove('gs-root');
    },
  };
}

import { startCrash } from './crash/crash';
import type { CrashInfo } from './crash/crashKind';
import { startFit } from './fit/fit';
import { startInstall } from './install/install';
import { startLifecycle, type LifecycleOptions } from './lifecycle/lifecycle';
import { injectStyles } from './styles';
import type { Disposable, GameShellHandle, GameShellLabels } from './types';
import { startVersionPoll } from './version/versionPoll';

export interface GameShellOptions {
  root: HTMLElement;
  appName: string;
  labels: GameShellLabels;
  appVersion?: string;
  install?: { snoozeDays?: number; storageKey?: string } | false;
  version?: { url: string; intervalMs: number; onNewVersion(): void };
  crash?: { report?(info: CrashInfo): string | void; origins?: string[] } | false;
  lifecycle?: LifecycleOptions;
}

export function initGameShell(opts: GameShellOptions): GameShellHandle {
  const doc = opts.root.ownerDocument;
  const win = doc.defaultView ?? window;
  injectStyles(doc);
  opts.root.classList.add('gs-root');
  const parts: Disposable[] = [startFit(win)];
  const install = opts.install === false ? null : startInstall({ appName: opts.appName, labels: opts.labels, ...opts.install, win });
  if (install) {
    parts.push(install);
  }
  if (opts.crash !== false) {
    parts.push(startCrash({ labels: opts.labels, report: opts.crash?.report, origins: opts.crash?.origins, appVersion: opts.appVersion, win }));
  }
  if (opts.lifecycle) {
    parts.push(startLifecycle(opts.lifecycle, doc));
  }
  if (opts.version) {
    parts.push(startVersionPoll({ ...opts.version, win }));
  }
  return {
    setPlaying: (playing: boolean): void => install?.setPlaying(playing),
    dispose: (): void => {
      parts.forEach((part) => part.dispose());
      opts.root.classList.remove('gs-root');
    },
  };
}

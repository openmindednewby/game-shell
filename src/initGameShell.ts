import { startIdleGate, WHEN_IDLE_GLOBAL, type WhenIdleWindow } from './idle/whenIdle';
import { startCrash } from './crash/crash';
import type { CrashInfo } from './crash/crashKind';
import { startFit } from './fit/fit';
import type { CardPlacement } from './install/CardPlacement';
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
  install?: { snoozeDays?: number; storageKey?: string; cardPlacement?: CardPlacement } | false;
  version?: { url: string; intervalMs: number; onNewVersion(): void };
  idle?: { maxWaitMs?: number };
  crash?: { report?(info: CrashInfo): string | void; origins?: string[] } | false;
  lifecycle?: LifecycleOptions;
}

export function initGameShell(opts: GameShellOptions): GameShellHandle {
  const doc = opts.root.ownerDocument;
  const win = doc.defaultView ?? window;
  injectStyles(doc);
  opts.root.classList.add('gs-root');
  const gate = startIdleGate({ win, maxWaitMs: opts.idle?.maxWaitMs });
  const idleWin = win as WhenIdleWindow;
  idleWin[WHEN_IDLE_GLOBAL] = gate.whenIdle;
  const parts: Disposable[] = [startFit(win), gate];
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
    const { onNewVersion } = opts.version;
    parts.push(startVersionPoll({ ...opts.version, onNewVersion: () => gate.whenIdle(onNewVersion), win }));
  }
  return {
    setPlaying: (playing: boolean): void => {
      install?.setPlaying(playing);
      gate.setPlaying(playing);
    },
    whenIdle: gate.whenIdle,
    dispose: (): void => {
      if (idleWin[WHEN_IDLE_GLOBAL] === gate.whenIdle) {
        delete idleWin[WHEN_IDLE_GLOBAL];
      }
      parts.forEach((part) => part.dispose());
      opts.root.classList.remove('gs-root');
    },
  };
}

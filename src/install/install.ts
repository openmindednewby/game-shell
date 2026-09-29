import type { Disposable, InstallLabels } from '../types';
import { renderBanner } from './banner';
import { BannerLayout } from './BannerLayout';
import { InstallVariant } from './InstallVariant';
import { isDesktop, isIosSafari, isStandalone } from './platform';
import { isSnoozed, snoozeKey, writeSnooze } from './snooze';

export const DEFAULT_SNOOZE_DAYS = 14;
const ACCEPTED = 'accepted';

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export interface InstallOptions {
  appName: string;
  labels: InstallLabels;
  snoozeDays?: number;
  storageKey?: string;
  win?: Window;
  now?: () => number;
}

interface InstallState {
  deferred: BeforeInstallPromptEvent | null;
  variant: InstallVariant | null;
  node: HTMLElement | null;
}

function createController(opts: InstallOptions, win: Window, now: () => number): {
  state: InstallState;
  isDismissed(): boolean;
  mount(): void;
  unmount(): void;
} {
  const key = snoozeKey(opts.appName, opts.storageKey);
  const state: InstallState = { deferred: null, variant: null, node: null };
  let dismissed = false;
  const unmount = (): void => {
    state.node?.remove();
    state.node = null;
  };
  const snooze = (): void => {
    writeSnooze(win, key, now());
    unmount();
  };
  const install = async (): Promise<void> => {
    const evt = state.deferred;
    state.deferred = null;
    if (!evt) {
      return;
    }
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === ACCEPTED) {
        unmount();
        return;
      }
      snooze();
    } catch {
      unmount();
    }
  };
  const mount = (): void => {
    if (state.variant === null) {
      return;
    }
    unmount();
    state.node = renderBanner({
      doc: win.document,
      layout: isDesktop(win) ? BannerLayout.Card : BannerLayout.Chip,
      variant: state.variant,
      appName: opts.appName,
      labels: opts.labels,
      onInstall: () => void install(),
      onDismiss: () => {
        dismissed = true;
        snooze();
      },
    });
    win.document.body.append(state.node);
  };
  return { state, isDismissed: (): boolean => dismissed, mount, unmount };
}

export function startInstall(opts: InstallOptions): Disposable {
  const win = opts.win ?? window;
  const now = opts.now ?? ((): number => Date.now());
  const key = snoozeKey(opts.appName, opts.storageKey);
  if (isStandalone(win) || isSnoozed(win, key, opts.snoozeDays ?? DEFAULT_SNOOZE_DAYS, now())) {
    return { dispose: (): void => undefined };
  }
  const ctl = createController(opts, win, now);
  const onPrompt = (e: Event): void => {
    e.preventDefault();
    ctl.state.deferred = e as BeforeInstallPromptEvent;
    ctl.state.variant = InstallVariant.Prompt;
    if (!ctl.isDismissed()) {
      ctl.mount();
    }
  };
  const onInstalled = (): void => {
    ctl.state.variant = null;
    ctl.unmount();
  };
  const onResize = (): void => {
    const node = ctl.state.node;
    if (node && (node.dataset.layout === BannerLayout.Card) !== isDesktop(win)) {
      ctl.mount();
    }
  };
  win.addEventListener('beforeinstallprompt', onPrompt);
  win.addEventListener('appinstalled', onInstalled);
  win.addEventListener('resize', onResize);
  if (isIosSafari(win)) {
    ctl.state.variant = InstallVariant.Ios;
    ctl.mount();
  }
  return {
    dispose: (): void => {
      win.removeEventListener('beforeinstallprompt', onPrompt);
      win.removeEventListener('appinstalled', onInstalled);
      win.removeEventListener('resize', onResize);
      ctl.unmount();
    },
  };
}

import type { GameShellHandle, InstallLabels } from '../types';
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
  dismissed: boolean;
  playing: boolean;
}

interface Controller {
  state: InstallState;
  mount(): void;
  unmount(): void;
  setPlaying(playing: boolean): void;
}

async function nativeChoice(evt: BeforeInstallPromptEvent): Promise<string | null> {
  try {
    await evt.prompt();
    return (await evt.userChoice).outcome;
  } catch {
    return null;
  }
}

function createController(opts: InstallOptions, win: Window, now: () => number): Controller {
  const key = snoozeKey(opts.appName, opts.storageKey);
  const state: InstallState = { deferred: null, variant: null, node: null, dismissed: false, playing: false };
  const unmount = (): void => {
    state.node?.remove();
    state.node = null;
  };
  const dismiss = (): void => {
    state.dismissed = true;
    writeSnooze(win, key, now());
    unmount();
  };
  const install = async (): Promise<void> => {
    const evt = state.deferred;
    state.deferred = null;
    if (!evt) {
      return;
    }
    const outcome = await nativeChoice(evt);
    if (outcome !== null && outcome !== ACCEPTED) {
      dismiss();
      return;
    }
    state.variant = null;
    unmount();
  };
  const mount = (): void => {
    if (state.variant === null || state.dismissed || state.playing) {
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
      onDismiss: dismiss,
    });
    win.document.body.append(state.node);
  };
  const setPlaying = (playing: boolean): void => {
    state.playing = playing;
    if (playing) {
      unmount();
    } else if (!state.node) {
      mount();
    }
  };
  return { state, mount, unmount, setPlaying };
}

const NOOP_HANDLE: GameShellHandle = { dispose: (): void => undefined, setPlaying: (): void => undefined };

export function startInstall(opts: InstallOptions): GameShellHandle {
  const win = opts.win ?? window;
  const now = opts.now ?? ((): number => Date.now());
  const key = snoozeKey(opts.appName, opts.storageKey);
  if (isStandalone(win) || isSnoozed(win, key, opts.snoozeDays ?? DEFAULT_SNOOZE_DAYS, now())) {
    return NOOP_HANDLE;
  }
  const ctl = createController(opts, win, now);
  const onPrompt = (e: Event): void => {
    e.preventDefault();
    ctl.state.deferred = e as BeforeInstallPromptEvent;
    ctl.state.variant = InstallVariant.Prompt;
    ctl.mount();
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
    setPlaying: ctl.setPlaying,
    dispose: (): void => {
      win.removeEventListener('beforeinstallprompt', onPrompt);
      win.removeEventListener('appinstalled', onInstalled);
      win.removeEventListener('resize', onResize);
      ctl.unmount();
    },
  };
}

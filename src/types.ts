export interface Disposable {
  dispose(): void;
}

export interface PlayingHandle extends Disposable {
  setPlaying(playing: boolean): void;
}

export interface GameShellHandle extends PlayingHandle {
  whenIdle(fn: () => void): void;
}

export interface GameShellLabels {
  install: string;
  addToHome: string;
  notNow: string;
  close?: string;
  tapShare: string;
  tapAdd: string;
  installBody: string;
  crashTitle: string;
  crashBody: string;
  reload: string;
  copyDetails: string;
  errorReported: string;
}

export type InstallLabels = Pick<GameShellLabels, 'install' | 'addToHome' | 'notNow' | 'close' | 'tapShare' | 'tapAdd' | 'installBody'>;

export type CrashLabels = Pick<GameShellLabels, 'crashTitle' | 'crashBody' | 'reload' | 'copyDetails' | 'errorReported'>;

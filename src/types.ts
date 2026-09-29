export interface Disposable {
  dispose(): void;
}

export interface GameShellLabels {
  install: string;
  addToHome: string;
  notNow: string;
  tapShare: string;
  tapAdd: string;
  installBody: string;
  crashTitle: string;
  crashBody: string;
  reload: string;
  copyDetails: string;
  errorReported: string;
}

export type InstallLabels = Pick<GameShellLabels, 'install' | 'addToHome' | 'notNow' | 'tapShare' | 'tapAdd' | 'installBody'>;

export type CrashLabels = Pick<GameShellLabels, 'crashTitle' | 'crashBody' | 'reload' | 'copyDetails' | 'errorReported'>;

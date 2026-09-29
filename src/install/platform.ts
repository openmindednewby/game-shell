export const DESKTOP_MIN_WIDTH = 1024;
const IOS_DEVICE_RE = /iPad|iPhone|iPod/;
const IOS_OTHER_BROWSER_RE = /CriOS|FxiOS|EdgiOS|OPiOS/;

interface IosNavigator extends Navigator {
  standalone?: boolean;
}

export function isStandalone(win: Window): boolean {
  const media = typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches;
  return media || (win.navigator as IosNavigator).standalone === true;
}

export function isIosSafari(win: Window): boolean {
  const ua = win.navigator.userAgent;
  const iPadAsMac = ua.includes('Macintosh') && win.navigator.maxTouchPoints > 1;
  const iosDevice = IOS_DEVICE_RE.test(ua) || iPadAsMac;
  return iosDevice && !IOS_OTHER_BROWSER_RE.test(ua);
}

export function isDesktop(win: Window): boolean {
  return win.innerWidth >= DESKTOP_MIN_WIDTH;
}

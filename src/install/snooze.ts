const DAY_MS = 86_400_000;

export function snoozeKey(appName: string, override?: string): string {
  return override ?? `gs-install-snooze:${appName}`;
}

export function isSnoozed(win: Window, key: string, days: number, now: number): boolean {
  try {
    const raw = win.localStorage.getItem(key);
    if (raw === null) {
      return false;
    }
    const at = Number(raw);
    return Number.isFinite(at) && now - at < days * DAY_MS;
  } catch {
    return false;
  }
}

export function writeSnooze(win: Window, key: string, now: number): void {
  try {
    win.localStorage.setItem(key, String(now));
  } catch {
    // Storage blocked (private mode, quota): the banner simply shows again next load.
  }
}

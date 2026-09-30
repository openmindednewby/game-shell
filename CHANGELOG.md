# Changelog

## 0.4.1

- `IdleGate.dispose()` no longer leaks (PWA-RELOAD-1 "Updates never reload a game mid-play"): a waiting callback runs if the game is not playing and is dropped during play; afterwards `whenIdle` and `setPlaying` arm no timer, add no listener and run nothing. The README documents that `initGameShell`'s `dispose()` removes `window.__gsWhenIdle` (pwa-sw then reloads at once) and that `version.onNewVersion` must reload because it takes the page's one slot.

## 0.4.0

- Reloads never interrupt play (PWA-RELOAD-1 "Updates never reload a game mid-play"). `initGameShell` installs `window.__gsWhenIdle(fn)` and exposes `handle.whenIdle(fn)`: `fn` runs at once outside play, else on the next `setPlaying(false)`, else after `idle.maxWaitMs` (default 30 min) on the next tab hide (at once if already hidden). One callback per page load; later calls are dropped. `version.onNewVersion` now goes through it. `startIdleGate`, `DEFAULT_IDLE_MAX_WAIT_MS`, `WHEN_IDLE_GLOBAL` and the `IdleGate` / `WhenIdle` / `WhenIdleWindow` types are exported. The IIFE build (`GameShell`) carries all of it.
- `startInstall` now returns the new `PlayingHandle` type (`dispose` + `setPlaying`); `GameShellHandle` extends it with `whenIdle`. Code that typed a `startInstall` result as `GameShellHandle` should use `PlayingHandle`.

## 0.3.0

- `install.cardPlacement` (`initGameShell`) / `cardPlacement` (`startInstall`): `'bottom-right'` (default, unchanged) or `'top-right'`, set as `data-placement` on the desktop card. The top-right card sits `--gs-card-top` (default 16px) plus the safe-area inset from the top, 24px in from the right. Games using it keep that corner free or set `--gs-card-top` (GAME-FIT-1 "Every game fits the screen and offers install", D25). `CardPlacement` is exported.

## 0.2.0

- `setPlaying(playing: boolean)` on the handle `initGameShell` / `startInstall` return (new `GameShellHandle` type): the install chip / card hides during play and returns on menus (GAME-FIT-1 "Every game fits the screen and offers install", D20).
- Dismissing the native install dialog keeps the chip hidden for the rest of the session, even when `beforeinstallprompt` fires again; the 14-day snooze starts at once (D22). An accepted or failed native prompt no longer re-shows a dead chip.
- Tests assert observable results instead of `not.toThrow` (D23).

## 0.1.5

- Match the Lintel mockup: `.gs-btn` and `.gs-chip` labels keep their 700 weight and size (the rules are `.gs .gs-btn` / `.gs .gs-chip`, so the `.gs button` `font:inherit` reset no longer beats them). Reload carries the reload icon (`ICONS.reload`).
- The install chip sits 16px in from the safe edge (was 12px), the G-2.7 edge.

## 0.1.4

- Crash overlay and report fire only for script errors whose file is same-origin with the page (or listed in `crash.origins`). Third-party errors (ads, analytics) and opaque cross-origin `Script error.` with no filename are ignored. `unhandledrejection` is unchanged.

## 0.1.3

- Install and Reload keep their --gs-accent fill: the primary rule is `.gs .gs-primary`, so the `.gs button` background reset no longer out-specifies it.

## 0.1.2

- Install: a beforeinstallprompt re-fired after Not now no longer brings the chip back in the same session.
- unlockAudio listens on pointerup / touchend / keydown (user activation) and stays armed until the context reports running.
- versionPoll stops its interval after firing and ignores a fetch that settles after dispose.
- fit dispose removes --gs-vh; Esc on the banner stops propagation; display-mode fullscreen counts as installed.
- Optional labels.close names the desktop card close button, so the card has one Not now control.
- initGameShell wires every part to the root's own window.
- yagni / yagni:ci scripts (ts-prune).

## 0.1.1

- Desktop install card sits 60px from the bottom by default, set by `--gs-card-bottom` (clears a bottom-right HUD badge).

## 0.1.0

- Initial release: fit, install, crash, lifecycle, versionPoll, initGameShell, game-shell.css, IIFE bundle.

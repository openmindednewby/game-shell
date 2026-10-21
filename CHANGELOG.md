# Changelog

## 0.8.0

- Controller indicator (GAME-PAD-1 "Show when a controller is connected"). `startPadToasts(opts?)` shows a polite toast `Controller connected: <name>` / `Controller disconnected: <name>` (`P<n> controller ...` with 2+ pads), sliding in unless reduced motion. `mountPadBadge(opts?)` mounts a small pad badge in a given parent or fixed bottom-left, hidden with no pad, `P1` `P2` slots with 2+. Built on `watchGamepads` (window gamepad events + `navigator.getGamepads()` snapshot) and `shortPadName`; `PAD_CHANGE`, `DEFAULT_PAD_LABELS`, `padToastText`, `padBadgeText` exported. New icon `gamepad`, classes `.gs-pad`, `.gs-pad-slot`, `.gs-sr`, `.gs-toast-slide`. Internal `mountToast` now backs `showToast` (unchanged API).

## 0.7.0

- `installCrashTelemetry(opts?)` (GAME-TELEMETRY-1 "Shared crash telemetry for games"): sends own-origin `error` events and every `unhandledrejection` to Umami as one `crash` event (`kind`, `message`, `source`, `ref`, `version`), each distinct `kind:message` once per page, at most `maxEvents` (default 5) per page, text cut to `maxText` (default 200). Reads `window.umami` at send time, so a tracker that is missing, late or throwing never breaks the game. `listen: false` skips the listeners and only returns `report(info)`, which plugs into `initGameShell({ crash: { report } })` so the overlay shows the same ref. Replaces the hand-written reporters in Surge `src/shell.ts:20` and SpeedX3D `src/game-shell.ts:40`.

## 0.6.0

- `?fps=1` frame meter (GAME-FEEL-1 "Make games feel well made"). `mountFpsMeter({ host?, search?, now? })` mounts an `FpsMeter` only when the query has `fps=1` (else `null`); `fpsEnabled(search?)`. `meter.push({ frameMs, simMs?, renderMs?, cpuMs? }, load?)` once per frame: fps from the median frame time, p50/p95 over the last 288 frames, mean sim/render/other when `cpuMs` is given, draws/tris/canvas size when `load` is given; repaints every 250 ms. `.gs-fps` sits top-left inside the safe area, pointer-events none. Ported from Surge `src/fpsMeter.ts`.

## 0.5.0

- Share and offline (GAME-SHARE-1 "Share, QR and offline download in every game"). `openShareSheet` (Web Share, copy-link fallback with a toast, QR code), `shareLink`, `copyLink`, `canWebShare`, `buildDeepLink`, `buildInviteText`, `qrSvg`, `showToast`, `SHARE_OUTCOME`; `downloadForOffline` (chunked `cache.addAll` with progress), `isAvailableOffline`, `isOfflineSupported`, `mountOfflineButton`, `OFFLINE_STATE`. New icons `link` and `check`, theme variables `--gs-qr-ink` / `--gs-qr-paper`.
- First runtime dependency: `qrcode-generator` (MIT). The IIFE build bundles it; ESM / CJS import it.

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

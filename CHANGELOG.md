# Changelog

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

# @dloizides/game-shell

The browser-side shell every EisaiPollis web game shares: it sizes the game to the height the player can actually see, offers install, shows a crash screen, pauses on hide, unlocks audio and notices a new deploy. Plain DOM + TypeScript, no runtime dependencies.

```ts
import { initGameShell, GS_RESIZE_EVENT } from '@dloizides/game-shell';

const shell = initGameShell({
  root: document.getElementById('game-container')!,
  appName: 'Aurora',
  appVersion: BUILD_VERSION,
  labels: { install, addToHome, notNow, tapShare, tapAdd, installBody,
            crashTitle, crashBody, reload, copyDetails, errorReported },
  crash: { report: (e) => sendToSink(e),            // return a short ref to show it
           origins: ['https://cdn.example.com'] },  // optional: extra script origins that count as the game's own
  lifecycle: { onHidden: pauseAudio, onVisible: resumeAudio },
  version: { url: '/version.txt', intervalMs: 300_000, onNewVersion: () => location.reload() },
});
window.addEventListener(GS_RESIZE_EVENT, () => game.scale.refresh());

// Keep the install chip / card off the playfield during a run; it comes back on the menu.
game.events.on('run-start', () => shell.setPlaying(true));
game.events.on('menu', () => shell.setPlaying(false));
```

`initGameShell` (and `startInstall`) return a `GameShellHandle`: `dispose()` plus `setPlaying(playing: boolean)`. While playing, the chip/card is removed and a `beforeinstallprompt` fired mid-run is held; `setPlaying(false)` shows it again unless the player already chose Not now, dismissed the native dialog, or installed.

Unity / Godot / vanilla pages: load `dist/game-shell.iife.js` (global `GameShell`) and `dist/game-shell.css`.

| Module | What it does |
|---|---|
| `startFit` | `--gs-vh` on `:root` = `visualViewport.height` (else `innerHeight`), re-measured on viewport resize / resize / orientationchange, one `gs:resize` event per change. `.gs-root` sizes a container from it. Never size a game with `100vh`. |
| `startInstall` | Top-left chip on phones, a card at ≥1024 px (bottom-right by default; `install: { cardPlacement: 'top-right' }` moves it to the top-right corner for games whose bottom-right holds controls), iOS Safari "Share → Add to Home Screen" steps. Hidden when standalone; "Not now" or dismissing the native install dialog snoozes 14 days and hides it for the rest of the session in `localStorage` (`gs-install-snooze:<appName>`). No scrim, no focus trap, Esc = Not now. |
| `startCrash` | `error` (ErrorEvent only) + `unhandledrejection` → `report()` every time, overlay once: Reload (focused) and Copy error details. |
| `startLifecycle` · `unlockAudio` · `prefersReducedMotion` | Visibility callbacks; resume an AudioContext on the first pointerdown/keydown; OS reduce-motion or `?reducedMotion=1`. |
| `startVersionPoll` | Fetches a URL (`no-store`) on an interval and when the tab is shown; calls `onNewVersion` once when the body changes. |

## Theme

Every overlay reads only these CSS variables; defaults are a neutral dark theme. Set them on `:root` in the game:
`--gs-font-display --gs-font-text --gs-surface --gs-surface-solid --gs-edge --gs-ink --gs-ink-dim --gs-accent --gs-on-accent --gs-scrim --gs-radius --gs-radius-pill --gs-focus`, plus `--gs-card-bottom` (desktop card offset from the bottom, default 60px) and `--gs-card-top` (offset from the top when `cardPlacement` is `'top-right'`, default 16px; both add the safe-area inset). A game that asks for `'top-right'` keeps that corner free of its own controls (for example a ☰ menu button), or sets `--gs-card-top` to clear them.

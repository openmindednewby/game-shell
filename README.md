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
```

Unity / Godot / vanilla pages: load `dist/game-shell.iife.js` (global `GameShell`) and `dist/game-shell.css`.

| Module | What it does |
|---|---|
| `startFit` | `--gs-vh` on `:root` = `visualViewport.height` (else `innerHeight`), re-measured on viewport resize / resize / orientationchange, one `gs:resize` event per change. `.gs-root` sizes a container from it. Never size a game with `100vh`. |
| `startInstall` | Top-left chip on phones, bottom-right card at ≥1024 px, iOS Safari "Share → Add to Home Screen" steps. Hidden when standalone; "Not now" snoozes 14 days in `localStorage` (`gs-install-snooze:<appName>`). No scrim, no focus trap, Esc = Not now. |
| `startCrash` | `error` (ErrorEvent only) + `unhandledrejection` → `report()` every time, overlay once: Reload (focused) and Copy error details. |
| `startLifecycle` · `unlockAudio` · `prefersReducedMotion` | Visibility callbacks; resume an AudioContext on the first pointerdown/keydown; OS reduce-motion or `?reducedMotion=1`. |
| `startVersionPoll` | Fetches a URL (`no-store`) on an interval and when the tab is shown; calls `onNewVersion` once when the body changes. |

## Theme

Every overlay reads only these CSS variables; defaults are a neutral dark theme. Set them on `:root` in the game:
`--gs-font-display --gs-font-text --gs-surface --gs-surface-solid --gs-edge --gs-ink --gs-ink-dim --gs-accent --gs-on-accent --gs-scrim --gs-radius --gs-radius-pill --gs-focus`, plus `--gs-card-bottom` (desktop card offset from the bottom, default 60px).

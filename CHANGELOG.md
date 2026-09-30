# Changelog

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

const STYLE_ID = 'gs-styles';

const THEME = `:where(:root){--gs-font-display:system-ui,'Segoe UI',sans-serif;--gs-font-text:system-ui,'Segoe UI',sans-serif;--gs-surface:rgba(24,26,29,.95);--gs-surface-solid:#181a1d;--gs-edge:#41464d;--gs-ink:#f3f3f1;--gs-ink-dim:#b9bdc2;--gs-accent:#f3f3f1;--gs-on-accent:#181a1d;--gs-scrim:rgba(0,0,0,.72);--gs-radius:12px;--gs-radius-pill:12px;--gs-focus:#9cc2ff;--gs-card-bottom:60px;--gs-safe-top:env(safe-area-inset-top,0px);--gs-safe-right:env(safe-area-inset-right,0px);--gs-safe-bottom:env(safe-area-inset-bottom,0px);--gs-safe-left:env(safe-area-inset-left,0px)}`;

const ROOT = `.gs-root{width:100%;height:100vh;height:100dvh;height:var(--gs-vh,100dvh)}`;

const BASE = `.gs{font-family:var(--gs-font-text);color:var(--gs-ink);box-sizing:border-box}
.gs *{box-sizing:border-box}
.gs button{min-width:44px;min-height:44px;margin:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.gs button:focus-visible{outline:2px solid var(--gs-focus);outline-offset:2px}
.gs svg{width:20px;height:20px;flex:none}
.gs-ico{display:inline-flex}
.gs-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 18px;border-radius:var(--gs-radius);font:700 16px/1 var(--gs-font-text);white-space:nowrap}
.gs-primary{background:var(--gs-accent);color:var(--gs-on-accent)}
.gs .gs-ghost{color:var(--gs-ink);border:1px solid var(--gs-edge)}
.gs-x{width:44px;height:44px;display:grid;place-items:center;color:var(--gs-ink-dim);flex:none}
.gs-txt{min-width:0}
.gs-txt b{display:block;font:400 18px/1.2 var(--gs-font-display);color:var(--gs-ink)}
.gs-txt span{display:block;font-size:14px;line-height:1.4;color:var(--gs-ink-dim);margin-top:3px}`;

const INSTALL = `.gs-install{position:fixed;z-index:2147483000;top:calc(12px + var(--gs-safe-top));left:calc(12px + var(--gs-safe-left))}
.gs-install[data-layout=card]{top:auto;left:auto;right:calc(24px + var(--gs-safe-right));bottom:calc(var(--gs-card-bottom,60px) + var(--gs-safe-bottom))}
.gs-seal{display:flex;align-items:center;background:var(--gs-surface);border:1px solid var(--gs-edge);border-radius:var(--gs-radius-pill)}
.gs-chip{display:flex;align-items:center;gap:8px;padding:0 6px 0 14px;font:700 15px var(--gs-font-text);color:var(--gs-ink)}
.gs-chip svg{color:var(--gs-accent)}
.gs-seal .gs-x{border-left:1px solid var(--gs-edge)}
.gs-steps{margin:8px 0 0;width:262px;padding:10px 14px;list-style:none;background:var(--gs-surface);border:1px solid var(--gs-edge);border-radius:var(--gs-radius);display:grid;gap:2px;counter-reset:s}
.gs-steps[hidden]{display:none}
.gs-steps li{display:flex;align-items:center;gap:10px;min-height:36px;font-size:15px;color:var(--gs-ink);counter-increment:s}
.gs-steps li::before{content:counter(s);font:400 15px var(--gs-font-display);color:var(--gs-ink-dim);width:12px}
.gs-steps svg{width:17px;height:17px;color:var(--gs-accent)}
.gs-card{position:relative;width:344px;max-width:calc(100vw - 48px);padding:18px;border-radius:var(--gs-radius);background:var(--gs-surface);border:1px solid var(--gs-edge);display:grid;gap:12px}
.gs-card .gs-x{position:absolute;top:4px;right:4px}
.gs-card .gs-txt{padding-right:36px}
.gs-card .gs-acts{display:flex;gap:8px}
.gs-card .gs-steps{width:auto;margin:0;border:0;padding:0;background:none}
.gs-app{width:40px;height:40px;border-radius:var(--gs-radius);background:var(--gs-surface-solid);border:1px solid var(--gs-edge);display:grid;place-items:center}
.gs-app i{width:13px;height:13px;border-radius:50%;background:var(--gs-accent);box-shadow:0 0 10px var(--gs-accent)}`;

const CRASH = `.gs-crash{position:fixed;inset:0;z-index:2147483001;background:var(--gs-scrim);display:grid;place-items:center;padding:20px}
.gs-panel{max-width:340px;background:var(--gs-surface-solid);border:1px solid var(--gs-edge);border-radius:var(--gs-radius);padding:24px}
.gs-h{margin:0;font:400 28px/1.15 var(--gs-font-display);color:var(--gs-ink)}
.gs-panel p{font-size:16px;line-height:1.5;color:var(--gs-ink-dim);margin:10px 0 0}
.gs-panel .gs-acts{display:flex;flex-direction:column;gap:8px;margin-top:20px}
.gs-panel .gs-ref{font:13px ui-monospace,monospace}
@media (min-width:1024px){.gs-panel{max-width:460px;padding:32px}.gs-panel .gs-acts{flex-direction:row}}`;

export const GAME_SHELL_CSS = [THEME, ROOT, BASE, INSTALL, CRASH].join('\n');

export function injectStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) {
    return;
  }
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = GAME_SHELL_CSS;
  doc.head.append(style);
}

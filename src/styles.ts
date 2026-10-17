const STYLE_ID = 'gs-styles';

const THEME = `:where(:root){--gs-font-display:system-ui,'Segoe UI',sans-serif;--gs-font-text:system-ui,'Segoe UI',sans-serif;--gs-surface:rgba(24,26,29,.95);--gs-surface-solid:#181a1d;--gs-edge:#41464d;--gs-ink:#f3f3f1;--gs-ink-dim:#b9bdc2;--gs-accent:#f3f3f1;--gs-on-accent:#181a1d;--gs-scrim:rgba(0,0,0,.72);--gs-radius:12px;--gs-radius-pill:12px;--gs-focus:#9cc2ff;--gs-card-bottom:60px;--gs-card-top:16px;--gs-qr-ink:#000;--gs-qr-paper:#fff;--gs-safe-top:env(safe-area-inset-top,0px);--gs-safe-right:env(safe-area-inset-right,0px);--gs-safe-bottom:env(safe-area-inset-bottom,0px);--gs-safe-left:env(safe-area-inset-left,0px)}`;

const ROOT = `.gs-root{width:100%;height:100vh;height:100dvh;height:var(--gs-vh,100dvh)}`;

const BASE = `.gs{font-family:var(--gs-font-text);color:var(--gs-ink);box-sizing:border-box}
.gs *{box-sizing:border-box}
.gs button{min-width:44px;min-height:44px;margin:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.gs button:focus-visible{outline:2px solid var(--gs-focus);outline-offset:2px}
.gs svg{width:20px;height:20px;flex:none}
.gs-ico{display:inline-flex}
.gs .gs-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:0 18px;border-radius:var(--gs-radius);font:700 16px/1 var(--gs-font-text);white-space:nowrap}
.gs .gs-primary{background:var(--gs-accent);color:var(--gs-on-accent)}
.gs .gs-ghost{color:var(--gs-ink);border:1px solid var(--gs-edge)}
.gs-x{width:44px;height:44px;display:grid;place-items:center;color:var(--gs-ink-dim);flex:none}
.gs-txt{min-width:0}
.gs-txt b{display:block;font:400 18px/1.2 var(--gs-font-display);color:var(--gs-ink)}
.gs-txt span{display:block;font-size:14px;line-height:1.4;color:var(--gs-ink-dim);margin-top:3px}`;

const INSTALL = `.gs-install{position:fixed;z-index:2147483000;top:calc(16px + var(--gs-safe-top));left:calc(16px + var(--gs-safe-left))}
.gs-install[data-layout=card]{top:auto;left:auto;right:calc(24px + var(--gs-safe-right));bottom:calc(var(--gs-card-bottom,60px) + var(--gs-safe-bottom))}
.gs-install[data-layout=card][data-placement=top-right]{top:calc(var(--gs-card-top,16px) + var(--gs-safe-top));bottom:auto}
.gs-seal{display:flex;align-items:center;background:var(--gs-surface);border:1px solid var(--gs-edge);border-radius:var(--gs-radius-pill)}
.gs .gs-chip{display:flex;align-items:center;gap:8px;padding:0 6px 0 14px;font:700 15px var(--gs-font-text);color:var(--gs-ink)}
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

const SHARE = `.gs-share{position:fixed;inset:0;z-index:2147483001;background:var(--gs-scrim);display:flex;align-items:flex-end;justify-content:center}
.gs-sheet{width:100%;max-height:calc(var(--gs-vh,100dvh) - 16px);overflow-y:auto;background:var(--gs-surface-solid);border:1px solid var(--gs-edge);border-bottom:0;border-radius:var(--gs-radius) var(--gs-radius) 0 0;padding:12px 16px calc(16px + var(--gs-safe-bottom));display:grid;gap:12px}
.gs-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.gs-sheet .gs-h{font-size:22px}
.gs-share-body{display:grid;gap:12px}
.gs-share-info{display:grid;gap:10px;min-width:0}
.gs-sheet p{margin:0;font-size:15px;line-height:1.4;color:var(--gs-ink-dim)}
.gs-sheet .gs-url{font:13px/1.4 ui-monospace,monospace;color:var(--gs-ink);overflow-wrap:anywhere}
.gs-qr{justify-self:center;width:min(200px,56vw);border-radius:var(--gs-radius);overflow:hidden}
.gs .gs-qr svg{display:block;width:100%;height:auto}
.gs-qr rect{fill:var(--gs-qr-paper)}
.gs-qr path{fill:var(--gs-qr-ink)}
.gs-sheet .gs-acts{display:flex;flex-direction:column;gap:8px}
.gs-toast{position:fixed;z-index:2147483002;left:50%;bottom:calc(24px + var(--gs-safe-bottom));transform:translateX(-50%);max-width:calc(100vw - 32px);padding:12px 16px;border-radius:var(--gs-radius);background:var(--gs-surface-solid);border:1px solid var(--gs-edge);font-size:15px;line-height:1.4}
@media (min-width:1024px){.gs-share{align-items:center;padding:24px}.gs-sheet{width:560px;border-bottom:1px solid var(--gs-edge);border-radius:var(--gs-radius);padding:20px 24px 24px}.gs-share-body{grid-template-columns:200px 1fr;gap:24px;align-items:center}.gs-qr{width:200px}}`;

const OFFLINE = `.gs-offline .gs-btn{position:relative;overflow:hidden;width:100%}
.gs-offline .gs-btn:disabled{cursor:default}
.gs-offline[data-state=done] .gs-btn{color:var(--gs-ink-dim)}
.gs-offline .gs-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--gs-edge)}
.gs-offline[data-state=idle] .gs-bar,.gs-offline[data-state=done] .gs-bar,.gs-offline[data-state=failed] .gs-bar{display:none}
.gs-offline .gs-bar i{display:block;height:100%;width:0;background:var(--gs-accent);transition:width .2s}`;

export const GAME_SHELL_CSS = [THEME, ROOT, BASE, INSTALL, CRASH, SHARE, OFFLINE].join('\n');

export function injectStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) {
    return;
  }
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = GAME_SHELL_CSS;
  doc.head.append(style);
}

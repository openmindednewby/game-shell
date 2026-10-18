export const FPS_WINDOW = 288;
export const FPS_REFRESH_MS = 250;
export const FPS_QUERY_PARAM = 'fps';

const P50 = 0.5;
const P95 = 0.95;
const MS_PER_SECOND = 1000;
const TRIS_PER_K = 1000;

/** Frame meter numbers: fps, frame ms p50/p95 over the last window, mean sim/render/other ms, the last load. */
export interface FpsSample { fps: number; p50: number; p95: number; draws: number; tris: number; sim: number; render: number; other: number; w: number; h: number }

/** One frame's times: wall ms since the previous frame, plus optional ms simulating, rendering and in the whole callback. */
export interface FrameTimes { frameMs: number; simMs?: number; renderMs?: number; cpuMs?: number }

/** Renderer load for the third meter line. */
export interface FrameLoad { draws: number; tris: number; w: number; h: number }

export interface FpsMeterOptions { now?: () => number }

export interface MountFpsMeterOptions extends FpsMeterOptions { host?: HTMLElement; search?: string }

const quantile = (sorted: Float32Array, n: number, p: number): number => sorted[Math.min(n - 1, Math.floor(p * (n - 1)))] ?? 0;

const mean = (a: Float32Array, n: number): number => {
  let s = 0;
  for (let i = 0; i < n; i++) {
    s += a[i] ?? 0;
  }
  return n > 0 ? s / n : 0;
};

/** True when the page query carries `?fps=1`. */
export function fpsEnabled(search: string = location.search): boolean {
  return new URLSearchParams(search).get(FPS_QUERY_PARAM) === '1';
}

/** The debug frame meter: call `push` once per frame; it repaints every FPS_REFRESH_MS. */
export class FpsMeter {
  private readonly frame = new Float32Array(FPS_WINDOW);
  private readonly sim = new Float32Array(FPS_WINDOW);
  private readonly render = new Float32Array(FPS_WINDOW);
  private readonly cpu = new Float32Array(FPS_WINDOW);
  private readonly sorted = new Float32Array(FPS_WINDOW);
  private readonly now: () => number;
  private readonly el: HTMLElement;
  private i = 0;
  private n = 0;
  private lastPaint = 0;
  last: FpsSample = { fps: 0, p50: 0, p95: 0, draws: 0, tris: 0, sim: 0, render: 0, other: 0, w: 0, h: 0 };

  constructor(host: HTMLElement, opts: FpsMeterOptions = {}) {
    this.now = opts.now ?? ((): number => performance.now());
    this.el = host.ownerDocument.createElement('pre');
    this.el.className = 'gs gs-fps';
    this.el.setAttribute('data-testid', 'fps-meter');
    this.el.setAttribute('aria-hidden', 'true');
    host.appendChild(this.el);
  }

  /** Takes the meter off the screen. */
  remove(): void {
    this.el.remove();
  }

  /** Records one frame and repaints when the refresh interval has passed. */
  push(times: FrameTimes, load?: FrameLoad): void {
    const k = this.i;
    this.frame[k] = times.frameMs;
    this.sim[k] = times.simMs ?? 0;
    this.render[k] = times.renderMs ?? 0;
    this.cpu[k] = times.cpuMs ?? 0;
    this.i = (k + 1) % FPS_WINDOW;
    this.n = Math.min(FPS_WINDOW, this.n + 1);
    const now = this.now();
    if (now - this.lastPaint < FPS_REFRESH_MS) {
      return;
    }
    this.lastPaint = now;
    this.last = this.sample(load);
    this.el.textContent = this.lines(times.cpuMs !== undefined, load).join('\n');
  }

  private sample(load?: FrameLoad): FpsSample {
    const n = this.n;
    this.sorted.set(this.frame);
    const s = this.sorted.subarray(0, n).sort();
    const p50 = quantile(s, n, P50);
    const sim = mean(this.sim, n);
    const render = mean(this.render, n);
    const { draws, tris, w, h } = load ?? { draws: 0, tris: 0, w: 0, h: 0 };
    return { fps: p50 > 0 ? MS_PER_SECOND / p50 : 0, p50, p95: quantile(s, n, P95), draws, tris, sim, render, other: mean(this.cpu, n) - sim - render, w, h };
  }

  private lines(withCpu: boolean, load?: FrameLoad): string[] {
    const l = this.last;
    const out = [`${l.fps.toFixed(0)} fps  ${l.p50.toFixed(1)}/${l.p95.toFixed(1)} ms p50/p95`];
    if (withCpu) {
      out.push(`sim ${l.sim.toFixed(2)}  render ${l.render.toFixed(2)}  other ${l.other.toFixed(2)} ms`);
    }
    if (load) {
      out.push(`${String(l.draws)} draws  ${String(Math.round(l.tris / TRIS_PER_K))}k tris  ${String(l.w)}x${String(l.h)}`);
    }
    return out;
  }
}

/** Mounts an FpsMeter on `host` (default document.body) only when the query has `?fps=1`; otherwise null. */
export function mountFpsMeter(opts: MountFpsMeterOptions = {}): FpsMeter | null {
  if (!fpsEnabled(opts.search)) {
    return null;
  }
  return new FpsMeter(opts.host ?? document.body, { now: opts.now });
}

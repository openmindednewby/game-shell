import { FPS_REFRESH_MS, FPS_WINDOW, FpsMeter, fpsEnabled, mountFpsMeter } from './fpsMeter';

const FRAME_60 = 1000 / 60;

function fakeClock(start = 0): { now: () => number; advance: (ms: number) => void } {
  let t = start;
  return { now: (): number => t, advance: (ms: number): void => { t += ms; } };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('fpsEnabled', () => {
  it('with fps=1 in the query, returns true', () => {
    const search = '?level=3&fps=1';

    const enabled = fpsEnabled(search);

    expect(enabled).toBe(true);
  });

  it('with fps=0, returns false', () => {
    const search = '?fps=0';

    const enabled = fpsEnabled(search);

    expect(enabled).toBe(false);
  });

  it('with no fps param, returns false', () => {
    const search = '';

    const enabled = fpsEnabled(search);

    expect(enabled).toBe(false);
  });
});

describe('mountFpsMeter', () => {
  it('without fps=1, mounts nothing and returns null', () => {
    const host = document.createElement('div');

    const meter = mountFpsMeter({ host, search: '?x=1' });

    expect(meter === null && host.childElementCount === 0).toBe(true);
  });

  it('with fps=1, mounts one fps-meter element in the host', () => {
    const host = document.createElement('div');

    mountFpsMeter({ host, search: '?fps=1' });

    expect(host.querySelectorAll('[data-testid="fps-meter"].gs-fps').length).toBe(1);
  });

  it('with no host, mounts on document.body', () => {
    const search = '?fps=1';

    mountFpsMeter({ search });

    expect(document.body.querySelector('[data-testid="fps-meter"]')).not.toBeNull();
  });
});

describe('FpsMeter.push', () => {
  it('with steady 60 fps frames, reports 60 fps and equal p50 and p95', () => {
    const clock = fakeClock();
    const meter = new FpsMeter(document.body, { now: clock.now });
    for (let i = 0; i < 10; i++) {
      meter.push({ frameMs: FRAME_60 });
    }
    clock.advance(FPS_REFRESH_MS);

    meter.push({ frameMs: FRAME_60 });

    expect([Math.round(meter.last.fps), meter.last.p50.toFixed(2), meter.last.p95.toFixed(2)]).toEqual([60, FRAME_60.toFixed(2), FRAME_60.toFixed(2)]);
  });

  it('with two slow frames in twenty, p95 picks up the spike while p50 stays', () => {
    const clock = fakeClock();
    const meter = new FpsMeter(document.body, { now: clock.now });
    for (let i = 0; i < 18; i++) {
      meter.push({ frameMs: 10 });
    }
    meter.push({ frameMs: 50 });
    clock.advance(FPS_REFRESH_MS);

    meter.push({ frameMs: 50 });

    expect([meter.last.p50, meter.last.p95]).toEqual([10, 50]);
  });

  it('before the refresh interval has passed, does not repaint', () => {
    const clock = fakeClock(FPS_REFRESH_MS);
    const meter = new FpsMeter(document.body, { now: clock.now });
    meter.push({ frameMs: 10 });
    clock.advance(FPS_REFRESH_MS - 1);

    meter.push({ frameMs: 20 });

    expect(meter.last.p95).toBe(10);
  });

  it('with sim, render and cpu times, reports their means and the remainder as other', () => {
    const clock = fakeClock();
    const meter = new FpsMeter(document.body, { now: clock.now });
    meter.push({ frameMs: 16, simMs: 2, renderMs: 4, cpuMs: 8 });
    clock.advance(FPS_REFRESH_MS);

    meter.push({ frameMs: 16, simMs: 4, renderMs: 6, cpuMs: 12 });

    expect([meter.last.sim, meter.last.render, meter.last.other]).toEqual([3, 5, 2]);
  });

  it('with more frames than the window, keeps only the newest window', () => {
    const clock = fakeClock();
    const meter = new FpsMeter(document.body, { now: clock.now });
    for (let i = 0; i < FPS_WINDOW; i++) {
      meter.push({ frameMs: 100 });
    }
    for (let i = 0; i < FPS_WINDOW - 1; i++) {
      meter.push({ frameMs: 10 });
    }
    clock.advance(FPS_REFRESH_MS);

    meter.push({ frameMs: 10 });

    expect(meter.last.p95).toBe(10);
  });

  it('with frame times only, paints one line', () => {
    const clock = fakeClock();
    const meter = new FpsMeter(document.body, { now: clock.now });
    clock.advance(FPS_REFRESH_MS);

    meter.push({ frameMs: 20 });

    expect(document.body.querySelector('pre')?.textContent).toBe('50 fps  20.0/20.0 ms p50/p95');
  });

  it('with cpu times and a load, paints the timing and load lines', () => {
    const clock = fakeClock();
    const meter = new FpsMeter(document.body, { now: clock.now });
    clock.advance(FPS_REFRESH_MS);

    meter.push({ frameMs: 20, simMs: 1, renderMs: 2, cpuMs: 4 }, { draws: 12, tris: 34_500, w: 390, h: 844 });

    expect(document.body.querySelector('pre')?.textContent?.split('\n')).toEqual([
      '50 fps  20.0/20.0 ms p50/p95',
      'sim 1.00  render 2.00  other 1.00 ms',
      '12 draws  35k tris  390x844',
    ]);
  });
});

describe('FpsMeter.remove', () => {
  it('after remove, the meter element is gone from the host', () => {
    const meter = new FpsMeter(document.body);

    meter.remove();

    expect(document.body.querySelector('[data-testid="fps-meter"]')).toBeNull();
  });
});

import { DEFAULT_MAX_CRASH_EVENTS, installCrashTelemetry, type CrashTelemetry, type CrashTelemetryWindow } from './crashTelemetry';

const umamiWin = window as CrashTelemetryWindow;
let telemetry: CrashTelemetry | null = null;

function fireError(message: string, filename = `${window.location.origin}/assets/game.js`): void {
  window.dispatchEvent(new ErrorEvent('error', { message, filename, lineno: 4, colno: 2 }));
}

function fireRejection(reason: unknown): void {
  const evt = new Event('unhandledrejection');
  Object.assign(evt, { reason });
  window.dispatchEvent(evt);
}

function installTracker(): jest.Mock {
  const track = jest.fn();
  umamiWin.umami = { track };
  return track;
}

afterEach(() => {
  telemetry?.dispose();
  telemetry = null;
  delete umamiWin.umami;
});

describe('installCrashTelemetry', () => {
  it('with an own-origin error, tracks one crash event with kind, message, source, ref and version', () => {
    const track = installTracker();
    telemetry = installCrashTelemetry({ appVersion: 'v1', now: () => 36 });

    fireError('boom');

    expect(track).toHaveBeenCalledWith('crash', {
      kind: 'error',
      message: 'boom',
      source: `${window.location.origin}/assets/game.js:4:2`,
      ref: '10',
      version: 'v1',
    });
  });

  it('with an unhandled rejection, tracks a rejection event', () => {
    const track = installTracker();
    telemetry = installCrashTelemetry();

    fireRejection('plain reason');

    expect(track.mock.calls[0]?.[1]).toMatchObject({ kind: 'rejection', message: 'plain reason' });
  });

  it('with a third-party script error, tracks nothing', () => {
    const track = installTracker();
    telemetry = installCrashTelemetry();

    fireError('ad failed', 'https://pagead2.googlesyndication.com/x.js');

    expect(track).not.toHaveBeenCalled();
  });

  it('with the same error twice, tracks it once and returns the first ref', () => {
    const track = installTracker();
    let t = 100;
    telemetry = installCrashTelemetry({ listen: false, now: () => t++ });
    const first = telemetry.report({ kind: 'error', message: 'loop' });

    const second = telemetry.report({ kind: 'error', message: 'loop' });

    expect(second).toBe(first);
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('past the event cap, tracks no more and returns undefined', () => {
    const track = installTracker();
    telemetry = installCrashTelemetry({ listen: false });
    for (let i = 0; i < DEFAULT_MAX_CRASH_EVENTS; i++) {
      telemetry.report({ kind: 'error', message: `e${i}` });
    }

    const ref = telemetry.report({ kind: 'error', message: 'one too many' });

    expect(ref).toBeUndefined();
    expect(track).toHaveBeenCalledTimes(DEFAULT_MAX_CRASH_EVENTS);
  });

  it('with a long message, truncates message and source to maxText', () => {
    const track = installTracker();
    telemetry = installCrashTelemetry({ listen: false, maxText: 3 });

    telemetry.report({ kind: 'error', message: 'abcdef', source: 'uvwxyz' });

    expect(track.mock.calls[0]?.[1]).toMatchObject({ message: 'abc', source: 'uvw' });
  });

  it('with no umami on the page, still returns a ref', () => {
    telemetry = installCrashTelemetry({ listen: false, now: () => 36 });

    const ref = telemetry.report({ kind: 'error', message: 'boom' });

    expect(ref).toBe('10');
  });

  it('with a throwing tracker, returns a ref instead of throwing', () => {
    umamiWin.umami = { track: (): void => { throw new Error('tracker down'); } };
    telemetry = installCrashTelemetry({ listen: false, now: () => 36 });

    const ref = telemetry.report({ kind: 'error', message: 'boom' });

    expect(ref).toBe('10');
  });

  it('with a tracker that loads after install, uses it at send time', () => {
    telemetry = installCrashTelemetry();
    const track = installTracker();

    fireError('late');

    expect(track).toHaveBeenCalledTimes(1);
  });

  it('after dispose, tracks nothing', () => {
    const track = installTracker();
    telemetry = installCrashTelemetry();
    telemetry.dispose();

    fireError('after');

    expect(track).not.toHaveBeenCalled();
  });

  it('with listen false, adds no window listeners', () => {
    const track = installTracker();
    telemetry = installCrashTelemetry({ listen: false });

    fireError('ignored');

    expect(track).not.toHaveBeenCalled();
  });
});

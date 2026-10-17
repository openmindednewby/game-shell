import qrcode from 'qrcode-generator';
import { buildDeepLink, buildInviteText, canWebShare, copyLink, shareLink } from './shareLink';
import type { ShareNavigator } from './shareLink';
import { SHARE_OUTCOME } from './shareOutcome';
import { openShareSheet } from './shareSheet';
import type { ShareSheetLabels } from './shareSheet';
import { qrSvg } from './qr';

const URL_ = 'https://surge.example/play?stage=3';
const LABELS: ShareSheetLabels = {
  title: 'Share',
  share: 'Share…',
  copyLink: 'Copy link',
  copied: 'Link copied',
  copyFailed: 'Could not copy',
  close: 'Close',
  qr: 'QR code',
};

function clipboardNav(writeText = jest.fn().mockResolvedValue(undefined)): ShareNavigator {
  return { clipboard: { writeText } };
}

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('buildDeepLink', () => {
  it('with a base carrying a query and hash, keeps only the given params', () => {
    const base = 'https://surge.example/play?reducedMotion=1#menu';

    const link = buildDeepLink({ stage: 3, daily: '2026-10-17', empty: '', none: undefined }, base);

    expect(link).toBe('https://surge.example/play?stage=3&daily=2026-10-17');
  });
});

describe('buildInviteText', () => {
  it('with a score var and an unknown placeholder, fills the score and keeps the unknown one', () => {
    const template = 'I reached {score} in {game}, beat me {who}';

    const text = buildInviteText(template, { score: '1,240 m', game: 'Surge' });

    expect(text).toBe('I reached 1,240 m in Surge, beat me {who}');
  });
});

describe('canWebShare', () => {
  it('with share present but canShare refusing the data, returns false', () => {
    const nav: ShareNavigator = { share: jest.fn(), canShare: () => false };

    const result = canWebShare({ url: URL_ }, nav);

    expect(result).toBe(false);
  });
});

describe('shareLink', () => {
  it('with Web Share resolving, returns shared and never touches the clipboard', async () => {
    const writeText = jest.fn();
    const nav: ShareNavigator = { share: jest.fn().mockResolvedValue(undefined), clipboard: { writeText } };

    const outcome = await shareLink({ url: URL_ }, nav);

    expect([outcome, writeText.mock.calls.length]).toEqual([SHARE_OUTCOME.Shared, 0]);
  });

  it('with the user dismissing the share sheet, returns cancelled without copying', async () => {
    const writeText = jest.fn();
    const abort = Object.assign(new Error('dismissed'), { name: 'AbortError' });
    const nav: ShareNavigator = { share: jest.fn().mockRejectedValue(abort), clipboard: { writeText } };

    const outcome = await shareLink({ url: URL_ }, nav);

    expect([outcome, writeText.mock.calls.length]).toEqual([SHARE_OUTCOME.Cancelled, 0]);
  });

  it('with Web Share failing for another reason, falls back to copying text and url', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    const nav: ShareNavigator = { share: jest.fn().mockRejectedValue(new TypeError('blocked')), clipboard: { writeText } };

    const outcome = await shareLink({ url: URL_, text: 'Beat 1,240 m' }, nav);

    expect([outcome, writeText.mock.calls[0]?.[0]]).toEqual([SHARE_OUTCOME.Copied, `Beat 1,240 m ${URL_}`]);
  });
});

describe('copyLink', () => {
  it('with no clipboard, returns failed', async () => {
    const nav: ShareNavigator = {};

    const outcome = await copyLink({ url: URL_ }, nav);

    expect(outcome).toBe(SHARE_OUTCOME.Failed);
  });

  it('with writeText rejecting, returns failed', async () => {
    const nav = clipboardNav(jest.fn().mockRejectedValue(new Error('denied')));

    const outcome = await copyLink({ url: URL_ }, nav);

    expect(outcome).toBe(SHARE_OUTCOME.Failed);
  });
});

describe('qrSvg', () => {
  it('with a url, draws a viewBox of the module count plus a 4-module quiet zone on each side', () => {
    const qr = qrcode(0, 'M');
    qr.addData(URL_);
    qr.make();
    const expected = qr.getModuleCount() + 8;

    const svg = qrSvg(URL_);

    expect(svg).toContain(`viewBox="0 0 ${expected} ${expected}"`);
  });
});

describe('openShareSheet', () => {
  it('without Web Share, offers only copy, and copy shows the copied toast and reports the outcome', async () => {
    const onOutcome = jest.fn();
    openShareSheet({ url: URL_, labels: LABELS, nav: clipboardNav(), onOutcome });
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('.gs-acts button')];

    buttons[0]?.click();
    await settle();

    expect([buttons.length, onOutcome.mock.calls[0]?.[0], document.querySelector('.gs-toast')?.textContent])
      .toEqual([1, SHARE_OUTCOME.Copied, LABELS.copied]);
  });

  it('with Web Share available, puts Share first and Copy link second', () => {
    const nav: ShareNavigator = { share: jest.fn().mockResolvedValue(undefined), ...clipboardNav() };

    openShareSheet({ url: URL_, labels: LABELS, nav });

    const texts = [...document.querySelectorAll('.gs-acts button')].map((b) => b.textContent);
    expect(texts).toEqual([LABELS.share, LABELS.copyLink]);
  });

  it('with Escape pressed, removes the sheet and calls onClose once', () => {
    const onClose = jest.fn();
    const handle = openShareSheet({ url: URL_, labels: LABELS, nav: clipboardNav(), onClose });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    handle.dispose();

    expect([document.querySelector('.gs-share'), onClose.mock.calls.length]).toEqual([null, 1]);
  });

  it('with a click on the scrim, closes the sheet', () => {
    openShareSheet({ url: URL_, labels: LABELS, nav: clipboardNav() });
    const root = document.querySelector<HTMLElement>('.gs-share');

    root?.click();

    expect(document.querySelector('.gs-share')).toBeNull();
  });
});

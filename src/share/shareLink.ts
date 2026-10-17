import { SHARE_OUTCOME } from './shareOutcome';
import type { ShareOutcome } from './shareOutcome';
import { fillTemplate } from './template';
import type { TemplateVars } from './template';

export interface ShareData {
  url: string;
  title?: string;
  text?: string;
}

export interface ShareNavigator {
  share?(data: ShareData): Promise<void>;
  canShare?(data: ShareData): boolean;
  clipboard?: { writeText(text: string): Promise<void> };
}

export type DeepLinkParams = Readonly<Record<string, string | number | undefined>>;

export function buildDeepLink(params: DeepLinkParams = {}, base: string = location.href): string {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function buildInviteText(template: string, vars: TemplateVars): string {
  return fillTemplate(template, vars);
}

function defaultNavigator(): ShareNavigator {
  return navigator as unknown as ShareNavigator;
}

export function canWebShare(data: ShareData, nav: ShareNavigator = defaultNavigator()): boolean {
  if (typeof nav.share !== 'function') {
    return false;
  }
  return typeof nav.canShare !== 'function' || nav.canShare(data);
}

function isAbort(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError';
}

function copyText(data: ShareData): string {
  return data.text !== undefined && data.text !== '' ? `${data.text} ${data.url}` : data.url;
}

export async function copyLink(data: ShareData, nav: ShareNavigator = defaultNavigator()): Promise<ShareOutcome> {
  const clipboard = nav.clipboard;
  if (clipboard === undefined) {
    return SHARE_OUTCOME.Failed;
  }
  try {
    await clipboard.writeText(copyText(data));
    return SHARE_OUTCOME.Copied;
  } catch {
    return SHARE_OUTCOME.Failed;
  }
}

export async function shareLink(data: ShareData, nav: ShareNavigator = defaultNavigator()): Promise<ShareOutcome> {
  if (canWebShare(data, nav) && nav.share !== undefined) {
    try {
      await nav.share(data);
      return SHARE_OUTCOME.Shared;
    } catch (error) {
      if (isAbort(error)) {
        return SHARE_OUTCOME.Cancelled;
      }
    }
  }
  return copyLink(data, nav);
}

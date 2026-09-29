const svg = (paths: string): string =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const ICONS = {
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  add: svg('<path d="M12 5v14M5 12h14"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  share: svg('<path d="M12 15V4M8 8l4-4 4 4M6 12v8h12v-8"/>'),
} as const;

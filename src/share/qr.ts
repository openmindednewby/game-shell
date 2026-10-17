import qrcode from 'qrcode-generator';

const QUIET_ZONE = 4;
const AUTO_TYPE_NUMBER = 0;

export function qrSvg(text: string): string {
  const qr = qrcode(AUTO_TYPE_NUMBER, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const size = count + QUIET_ZONE * 2;
  const parts: string[] = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        parts.push(`M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`);
      }
    }
  }
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><rect width="${size}" height="${size}"/><path d="${parts.join('')}"/></svg>`;
}

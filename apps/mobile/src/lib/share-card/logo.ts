export function sizedLogoSvg(source: string, width: number): string {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  const svg = document.documentElement;
  const originalWidth = Number(svg.getAttribute('width'));
  const originalHeight = Number(svg.getAttribute('height'));
  if (svg.localName !== 'svg' || !svg.getAttribute('viewBox') || !Number.isFinite(width) || width <= 0 || !originalWidth || !originalHeight) {
    throw new Error('Логотип недоступен.');
  }
  svg.setAttribute('width', String(Math.ceil(width)));
  svg.setAttribute('height', String(Math.ceil(width * originalHeight / originalWidth)));
  return new XMLSerializer().serializeToString(svg);
}

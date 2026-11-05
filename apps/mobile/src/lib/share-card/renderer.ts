import { lightColorMap } from '@bidplace/design-tokens';
import { canvasSize, fitCroppedImage, pillFontSize, textFontSize, textLineLimit, wrapText, type ShareFormat } from './layout';
import type { CardLayer } from './templates';
import { sizedLogoSvg } from './logo';

type Dimensions = { width: number; height: number };

async function decode(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Не удалось загрузить изображение.'));
    image.src = src;
  });
  return image;
}

export async function renderCard(input: {
  cover: Blob | null;
  logoUrl: string;
  format: ShareFormat | 'receipt';
  layers: CardLayer[];
  preview?: boolean;
  crop?: { x: number; y: number; width: number; height: number } | null;
}): Promise<Blob> {
  const imageUrl = input.cover ? URL.createObjectURL(input.cover) : null;
  let canvas: HTMLCanvasElement | undefined;
  try {
    const [image, logoResponse] = await Promise.all([imageUrl ? decode(imageUrl) : Promise.resolve(null), fetch(input.logoUrl, { credentials: 'omit' })]);
    if (!logoResponse.ok) throw new Error('Логотип недоступен.');
    const logoSource = await logoResponse.text();
    const fonts = await document.fonts.load('16px Inter_500Medium');
    if (!fonts.length) throw new Error('Шрифт недоступен.');
    const size: Dimensions = input.format === 'receipt'
      ? { width: 1080, height: 1350 }
      : canvasSize(input.format, image ? { width: image.naturalWidth, height: image.naturalHeight } : undefined);
    const scale = input.preview ? Math.min(1, 350 / Math.max(size.width, size.height)) : 1;
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(size.width * scale));
    canvas.height = Math.max(1, Math.round(size.height * scale));
    const logoSvg = sizedLogoSvg(logoSource, canvas.width);
    const logoObjectUrl = URL.createObjectURL(new Blob([logoSvg], { type: 'image/svg+xml' }));
    let logo: HTMLImageElement;
    try { logo = await decode(logoObjectUrl); } finally { URL.revokeObjectURL(logoObjectUrl); }
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Не удалось создать изображение.');
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = lightColorMap.white;
    ctx.fillRect(0, 0, w, h);
    let logoBottom = 0;
    for (const layer of input.layers) {
      if (layer.kind === 'image') {
        if (!image) continue;
        const size = { width: image.naturalWidth, height: image.naturalHeight };
        const box = { x: w * layer.x, y: h * layer.y, w: w * layer.width, h: h * layer.height };
        if (layer.background === 'blur') {
          const backdrop = fitCroppedImage('cover', size, box, null);
          ctx.save();
          ctx.filter = `blur(${Math.max(1, w * 0.1)}px)`;
          ctx.drawImage(image, backdrop.sx, backdrop.sy, backdrop.sw, backdrop.sh, backdrop.dx, backdrop.dy, backdrop.dw, backdrop.dh);
          ctx.restore();
        }
        const fit = fitCroppedImage(layer.fit, size, box, null);
        ctx.drawImage(image, fit.sx, fit.sy, fit.sw, fit.sh, fit.dx, fit.dy, fit.dw, fit.dh);
      } else if (layer.kind === 'logo') {
        const width = input.format === 'original' ? Math.min(w * layer.width, h * 0.3 * logo.naturalWidth / logo.naturalHeight) : w * layer.width;
        const logoHeight = width * logo.naturalHeight / logo.naturalWidth;
        ctx.drawImage(logo, input.format === 'original' ? (w - width) / 2 : w * layer.x, h * layer.y, width, logoHeight);
        logoBottom = h * layer.y + logoHeight;
      } else if (layer.kind === 'text') {
        const nextText = Math.min(1, ...input.layers.filter((item) => item.kind === 'text' && item.y > layer.y).map((item) => item.y));
        const font = textFontSize(w, layer.size, (nextText - layer.y) * h);
        ctx.font = `${font}px Inter_500Medium`;
        ctx.fillStyle = layer.color === 'light' ? lightColorMap.white : lightColorMap.inkStrong;
        ctx.textBaseline = 'top';
        if (layer.color === 'light') { ctx.shadowColor = lightColorMap.inkStrong; ctx.shadowBlur = font / 4; }
        const maxLines = textLineLimit(layer.lines, (nextText - layer.y) * h, font * 1.3);
        const lines = wrapText((value) => ctx.measureText(value).width, layer.text, w * layer.width, maxLines);
        lines.forEach((line, index) => {
          const x = w * layer.x;
          const y = h * layer.y + index * font * 1.3;
          if (layer.color === 'light') { ctx.strokeStyle = lightColorMap.inkStrong; ctx.lineWidth = Math.max(1, font * 0.1); ctx.lineJoin = 'round'; ctx.strokeText(line, x, y); }
          ctx.fillText(line, x, y);
        });
        ctx.shadowBlur = 0;
      } else {
        const start = Math.max(h * layer.y, logoBottom + w * 0.025);
        const textStart = Math.min(0.96, ...input.layers.filter((item) => item.kind === 'text').map((item) => item.y));
        const font = input.format === 'original' ? pillFontSize(w, start, layer.rows.length, h * textStart - h * 0.02) : Math.max(8, w * 0.04);
        ctx.font = `${font}px Inter_500Medium`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        layer.rows.forEach((row, index) => {
          const gap = font * 0.6;
          const available = (w * 0.9 - gap * (row.length - 1)) / row.length;
          const texts = row.map((value) => wrapText((item) => ctx.measureText(item).width, value, available - font * 1.4, 1)[0] ?? '');
          const widths = texts.map((text) => ctx.measureText(text).width + font * 1.4);
          const total = widths.reduce((sum, width) => sum + width, 0) + gap * (row.length - 1);
          let x = (w - total) / 2;
          const height = font * 1.8;
          const y = start + index * height * 1.12;
          texts.forEach((text, textIndex) => {
            const width = widths[textIndex] ?? 0;
            ctx.fillStyle = lightColorMap.white;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            const radius = Math.min(height / 2, width / 2);
            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + width, y, x + width, y + height, radius);
            ctx.arcTo(x + width, y + height, x, y + height, radius);
            ctx.arcTo(x, y + height, x, y, radius);
            ctx.arcTo(x, y, x + width, y, radius);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = lightColorMap.inkStrong;
            ctx.fillText(text, x + width / 2, y + height / 2);
            x += width + gap;
          });
        });
        ctx.textAlign = 'start';
      }
    }
    const mime = input.format === 'receipt' ? 'image/png' : 'image/jpeg';
    const outputCanvas = canvas;
    return await new Promise<Blob>((resolve, reject) => outputCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Не удалось сохранить изображение.')), mime, 0.9));
  } finally {
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }
}

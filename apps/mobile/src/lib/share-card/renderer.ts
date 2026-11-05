import { lightColorMap } from '@bidplace/design-tokens';
import { canvasSize, fitCroppedImage, pillFontSize, textFontSize, textLineLimit, wrapText, type ShareFormat } from './layout';
import type { CardLayer } from './templates';

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
  cover: Blob;
  logoUrl: string;
  format: ShareFormat | 'receipt';
  layers: CardLayer[];
  preview?: boolean;
  crop?: { x: number; y: number; width: number; height: number } | null;
}): Promise<Blob> {
  const imageUrl = URL.createObjectURL(input.cover);
  let canvas: HTMLCanvasElement | undefined;
  try {
    const [image, logo] = await Promise.all([decode(imageUrl), decode(input.logoUrl)]);
    const fonts = await document.fonts.load('16px Inter_500Medium');
    if (!fonts.length) throw new Error('Шрифт недоступен.');
    const size: Dimensions = input.format === 'receipt'
      ? { width: 1080, height: 1350 }
      : canvasSize(input.format, { width: image.naturalWidth, height: image.naturalHeight });
    const scale = input.preview ? Math.min(1, 350 / Math.max(size.width, size.height)) : 1;
    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(size.width * scale));
    canvas.height = Math.max(1, Math.round(size.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Не удалось создать изображение.');
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = lightColorMap.white;
    ctx.fillRect(0, 0, w, h);
    let logoBottom = 0;
    for (const layer of input.layers) {
      if (layer.kind === 'image') {
        const fit = fitCroppedImage(layer.fit, { width: image.naturalWidth, height: image.naturalHeight }, { x: w * layer.x, y: h * layer.y, w: w * layer.width, h: h * layer.height }, input.format === 'original' || input.format === 'receipt' ? null : input.crop ?? null);
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
        lines.forEach((line, index) => ctx.fillText(line, w * layer.x, h * layer.y + index * font * 1.3));
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
    URL.revokeObjectURL(imageUrl);
  }
}

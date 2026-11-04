export type ShareFormat = 'story' | 'post' | 'square' | 'original';
type Size = { width: number; height: number };
type Box = { x: number; y: number; w: number; h: number };

export function canvasSize(format: ShareFormat, image?: Size): Size {
  if (format === 'story') return { width: 1080, height: 1920 };
  if (format === 'post') return { width: 1080, height: 1350 };
  if (format === 'square') return { width: 1080, height: 1080 };
  if (!image || !Number.isFinite(image.width) || !Number.isFinite(image.height) || image.width <= 0 || image.height <= 0) {
    throw new Error('Original format requires valid image dimensions');
  }
  const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
  return { width: Math.max(1, Math.round(image.width * scale)), height: Math.max(1, Math.round(image.height * scale)) };
}

export function fitImage(fit: 'cover' | 'contain', image: Size, box: Box) {
  if (![image.width, image.height, box.x, box.y, box.w, box.h].every(Number.isFinite) || image.width <= 0 || image.height <= 0 || box.w <= 0 || box.h <= 0) throw new Error('Invalid image or box dimensions');
  const scale = fit === 'cover'
    ? Math.max(box.w / image.width, box.h / image.height)
    : Math.min(box.w / image.width, box.h / image.height);
  if (fit === 'cover') {
    const sw = box.w / scale;
    const sh = box.h / scale;
    return { sx: (image.width - sw) / 2, sy: (image.height - sh) / 2, sw, sh, dx: box.x, dy: box.y, dw: box.w, dh: box.h };
  }
  const dw = image.width * scale;
  const dh = image.height * scale;
  return { sx: 0, sy: 0, sw: image.width, sh: image.height, dx: box.x + (box.w - dw) / 2, dy: box.y + (box.h - dh) / 2, dw, dh };
}

export function wrapText(measure: (value: string) => number, text: string, maxWidth: number, maxLines: number): string[] {
  if (maxWidth <= 0 || maxLines <= 0 || !text.trim()) return [];
  const words = text.trim().split(/\s+/);
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const graphemes = (value: string) => Array.from(segmenter.segment(value), (item) => item.segment);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const combined = line ? `${line} ${word}` : word;
    if (measure(combined) <= maxWidth) { line = combined; continue; }
    if (line) { lines.push(line); line = ''; }
    for (const character of graphemes(word)) {
      if (measure(character) > maxWidth) throw new Error('Text does not fit in the available width');
      if (line && measure(line + character) > maxWidth) { lines.push(line); line = ''; }
      line += character;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const result = lines.slice(0, maxLines);
  let last = result[maxLines - 1] ?? '';
  while (last && measure(`${last}…`) > maxWidth) last = graphemes(last).slice(0, -1).join('');
  result[maxLines - 1] = measure(`${last}…`) <= maxWidth ? `${last}…` : '';
  return result;
}

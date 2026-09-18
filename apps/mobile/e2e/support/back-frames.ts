import type { Page } from '@playwright/test';

export type BackFrame = {
  t: number;
  href: string;
  home: string;
  work: string;
  author: string;
  overlay: string;
  loading: string;
  gallery: string;
};

export function uniqueBackFrames(frames: BackFrame[]) {
  const unique: BackFrame[] = [];
  for (const frame of frames) {
    const previous = unique.at(-1);
    if (
      !previous ||
      previous.href !== frame.href ||
      previous.home !== frame.home ||
      previous.work !== frame.work ||
      previous.author !== frame.author ||
      previous.overlay !== frame.overlay ||
      previous.loading !== frame.loading ||
      previous.gallery !== frame.gallery
    ) {
      unique.push(frame);
    }
  }
  return unique;
}

export async function recordBackFrames(page: Page, click: () => Promise<void>) {
  const recording = page.evaluate(() => {
    const vis = (id: string) => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      if (!el) return 'missing';
      let node: HTMLElement | null = el as HTMLElement;
      while (node && node !== document.body) {
        const cs = getComputedStyle(node);
        if (
          cs.display === 'none' ||
          cs.visibility === 'hidden' ||
          cs.opacity === '0' ||
          node.inert ||
          node.getAttribute('aria-hidden') === 'true'
        ) {
          return 'hidden';
        }
        node = node.parentElement;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return 'zero';
      return 'visible';
    };
    const take = () => ({
      t: Math.round(performance.now()),
      href: location.pathname + location.search,
      home: vis('home-scroll'),
      work: vis('product-scroll-view'),
      author: vis('creator-scroll'),
      overlay: vis('search-overlay'),
      loading: vis('infrastructure-page-status-loading'),
      gallery: vis('work-gallery'),
    });
    return new Promise<ReturnType<typeof take>[]>((resolve) => {
      const frames: ReturnType<typeof take>[] = [];
      const start = performance.now();
      const tick = () => {
        frames.push(take());
        if (performance.now() - start < 500) requestAnimationFrame(tick);
        else resolve(frames);
      };
      requestAnimationFrame(tick);
    });
  });
  await click();
  return uniqueBackFrames(await recording);
}

export async function inactiveScreenIsolation(page: Page, testId: string) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) {
      return { missing: true, laidOut: false, inert: false, pointerNone: false };
    }
    const box = el.getBoundingClientRect();
    let node: HTMLElement | null = el as HTMLElement;
    let inert = false;
    let pointerNone = false;
    while (node && node !== document.body) {
      if (node.inert) inert = true;
      if (getComputedStyle(node).pointerEvents === 'none') pointerNone = true;
      node = node.parentElement;
    }
    return {
      missing: false,
      laidOut: box.width > 4 && box.height > 4,
      inert,
      pointerNone,
    };
  }, testId);
}

export async function tabHitsTestId(page: Page, testId: string, presses = 40) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    const hit = await page.evaluate((id) => {
      const active = document.activeElement;
      return Boolean(active && active.closest(`[data-testid="${id}"]`));
    }, testId);
    if (hit) return true;
  }
  return false;
}

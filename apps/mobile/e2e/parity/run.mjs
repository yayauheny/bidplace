import { createRequire } from 'node:module';
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { chromium, webkit } from '@playwright/test';

import {
  FIGMA_REFERENCES,
  geometryCatalog,
  handoffPath,
} from './figma-nodes.mjs';

const require = createRequire(import.meta.url);
const sharp = require('../../../api/node_modules/sharp');

const WEB = process.env.PARITY_WEB_URL ?? 'http://localhost:8011';
const API = process.env.PARITY_API_URL ?? 'http://localhost:3011';
const OUT = join(
  import.meta.dirname,
  '../../../../artifacts/figma-qa/parity',
);
const VIEW = { width: 390, height: 860 };
const DPR = 1;
const COMPACT_STEPS = [0, 0.25, 0.5, 0.75, 1];

const catalog = geometryCatalog();

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

async function cropPng(sourceRel, box, dest) {
  const source = handoffPath(sourceRel);
  const image = sharp(source);
  const meta = await image.metadata();
  const left = Math.max(0, Math.round(box.x));
  const top = Math.max(0, Math.round(box.y));
  const width = Math.max(1, Math.min(Math.round(box.width), (meta.width ?? 0) - left));
  const height = Math.max(
    1,
    Math.min(Math.round(box.height), (meta.height ?? 0) - top),
  );
  await image.extract({ left, top, width, height }).png().toFile(dest);
  return { left, top, width, height, source: sourceRel };
}

async function overlayAndDiff(figmaPath, runtimePath, destDir) {
  const figma = sharp(figmaPath);
  const runtime = sharp(runtimePath);
  const [fm, rm] = await Promise.all([figma.metadata(), runtime.metadata()]);
  const width = Math.min(fm.width ?? 0, rm.width ?? 0);
  const height = Math.min(fm.height ?? 0, rm.height ?? 0);
  if (!width || !height) {
    throw new Error(`Cannot compare ${figmaPath} and ${runtimePath}`);
  }
  const figmaBuf = await sharp(figmaPath)
    .extract({ left: 0, top: 0, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const runtimeBuf = await sharp(runtimePath)
    .extract({ left: 0, top: 0, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const overlay = Buffer.alloc(width * height * 4);
  const diff = Buffer.alloc(width * height * 4);
  let maxDelta = 0;
  let sum = 0;
  let hot = 0;
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    const dr = Math.abs(figmaBuf[o] - runtimeBuf[o]);
    const dg = Math.abs(figmaBuf[o + 1] - runtimeBuf[o + 1]);
    const db = Math.abs(figmaBuf[o + 2] - runtimeBuf[o + 2]);
    const delta = Math.max(dr, dg, db);
    maxDelta = Math.max(maxDelta, delta);
    sum += (dr + dg + db) / 3;
    if (delta >= 24) hot += 1;
    overlay[o] = Math.round(figmaBuf[o] * 0.5 + runtimeBuf[o] * 0.5);
    overlay[o + 1] = Math.round(figmaBuf[o + 1] * 0.45 + runtimeBuf[o + 1] * 0.55);
    overlay[o + 2] = Math.round(figmaBuf[o + 2] * 0.4 + runtimeBuf[o + 2] * 0.6);
    overlay[o + 3] = 255;
    const heat = Math.min(255, delta * 3);
    diff[o] = heat;
    diff[o + 1] = 255 - heat;
    diff[o + 2] = 40;
    diff[o + 3] = 255;
  }
  await Promise.all([
    sharp(overlay, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(join(destDir, 'overlay.png')),
    sharp(diff, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(join(destDir, 'diff.png')),
  ]);
  return {
    width,
    height,
    maxDelta,
    meanDelta: Number((sum / (width * height)).toFixed(2)),
    hotRatio: Number((hot / (width * height)).toFixed(4)),
  };
}

async function waitReady(page) {
  await page.waitForFunction(async () => {
    await document.fonts.ready;
    const images = [...document.images];
    return (
      images.length === 0 ||
      images.every((image) => image.complete && image.naturalWidth > 0)
    );
  }, { timeout: 30_000 });
  await page.waitForTimeout(120);
}

async function measure(page) {
  return page.evaluate(() => {
    const css = (el) => (el ? getComputedStyle(el) : null);
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Number(r.x.toFixed(2)),
        y: Number(r.y.toFixed(2)),
        width: Number(r.width.toFixed(2)),
        height: Number(r.height.toFixed(2)),
      };
    };
    const typeOf = (el) => {
      if (!el) return null;
      const s = css(el);
      return {
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        box: box(el),
      };
    };
    const dock = document.querySelector('[data-testid="figma-floating-dock"]');
    const atmosphere = document.querySelector('[data-testid="author-atmosphere"]');
    const frost = document.querySelector('[data-testid="figma-cover-frost"]');
    const avatar = document.querySelector('[data-testid="creator-avatar"]');
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const worksTab = tabs.find((tab) => tab.textContent?.includes('Работы'));
    const count =
      worksTab?.querySelector('[data-testid="figma-tab-count"]') ??
      worksTab?.querySelector('sup') ??
      null;
    const cards = [...document.querySelectorAll('a[href^="/product/"]')].map(
      (node) => box(node),
    );
    const opening = document.getElementById('home-opening-work');
    const newWorks = document.getElementById('home-new-works');
    const scroll = document.querySelector('[data-testid="creator-scroll"]');
    const homeScroll = document.querySelector('[data-testid="home-scroll"]');
    const header = document.querySelector('.creator-header');
    return {
      dpr: window.devicePixelRatio,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scrollTop: scroll instanceof HTMLElement ? scroll.scrollTop : homeScroll instanceof HTMLElement ? homeScroll.scrollTop : 0,
      progress: header
        ? Number(
            getComputedStyle(header).getPropertyValue('--creator-progress') ||
              '0',
          )
        : null,
      dock: {
        box: box(dock),
        padding: css(dock)?.padding,
        gap: css(dock?.querySelector('.figma-dock-items'))?.gap,
        radius: css(dock)?.borderRadius,
        background: css(dock)?.backgroundColor,
        backdrop: css(dock)?.backdropFilter || css(dock)?.webkitBackdropFilter,
        filter: css(dock)?.filter,
        boxShadow: css(dock)?.boxShadow,
      },
      atmosphere: {
        box: box(atmosphere),
        opacity: css(atmosphere)?.opacity,
        radius: css(atmosphere?.firstElementChild)?.borderBottomLeftRadius,
        filter: css(atmosphere)?.filter,
        wash: atmosphere
          ? css(atmosphere.querySelector('div + div, [style*="background"]'))
              ?.backgroundColor
          : null,
      },
      frost: {
        box: box(frost),
        backdrop: frost
          ? css(frost.firstElementChild)?.backdropFilter ||
            css(frost.firstElementChild)?.webkitBackdropFilter
          : null,
      },
      avatar: box(avatar),
      worksTab: typeOf(worksTab),
      tabCount: typeOf(count),
      cards,
      openingCard: box(opening?.firstElementChild ?? opening),
      newWorksHeading: typeOf(
        newWorks?.querySelector('[role="heading"], h2, p, span, div'),
      ),
      firstNewWorkCard: newWorks
        ? box(newWorks.querySelector('a[href^="/product/"]'))
        : null,
    };
  });
}

async function setCreatorScroll(page, top) {
  await page.evaluate((value) => {
    const root = document.querySelector('[data-testid="creator-scroll"]');
    if (!(root instanceof HTMLElement)) return;
    const target =
      root.scrollHeight > root.clientHeight + 1
        ? root
        : [...root.querySelectorAll('*')].find(
            (node) =>
              node instanceof HTMLElement &&
              node.scrollHeight > node.clientHeight + 1,
          ) ?? root;
    if (target instanceof HTMLElement) {
      target.scrollTop = value;
      target.dispatchEvent(new Event('scroll', { bubbles: true }));
    }
  }, top);
}

async function compactOffset(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.creator-header');
    const height = header?.getBoundingClientRect().height ?? 450;
    return Math.max(0, Math.round(height - 186));
  });
}

async function openPage(page, path) {
  await page.goto(`${WEB}${path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
  await page
    .locator('[data-testid="figma-floating-dock"], [data-testid="creator-scroll"], [data-testid="home-scroll"]')
    .first()
    .waitFor({ timeout: 60_000 });
  await waitReady(page);
}

async function captureState(page, dest, figmaRel, figmaBox) {
  ensureDir(dest);
  if (figmaRel && figmaBox) {
    await cropPng(figmaRel, figmaBox, join(dest, 'figma.png'));
  }
  await page.screenshot({
    path: join(dest, 'runtime.png'),
    animations: 'disabled',
  });
  const measured = await measure(page);
  let compare = null;
  if (figmaRel && figmaBox) {
    compare = await overlayAndDiff(
      join(dest, 'figma.png'),
      join(dest, 'runtime.png'),
      dest,
    );
  }
  writeFileSync(
    join(dest, 'measure.json'),
    JSON.stringify({ measured, compare, figmaBox }, null, 2),
  );
  return { measured, compare };
}

async function captureElement(page, selector, dest, figmaRel, figmaBox) {
  ensureDir(dest);
  if (figmaRel && figmaBox) {
    await cropPng(figmaRel, figmaBox, join(dest, 'figma.png'));
  }
  const handle = await page.$(selector);
  if (!handle) throw new Error(`Missing ${selector}`);
  const measured = await measure(page);
  await handle.screenshot({ path: join(dest, 'runtime.png'), animations: 'disabled' });
  let compare = null;
  if (figmaRel && figmaBox) {
    compare = await overlayAndDiff(
      join(dest, 'figma.png'),
      join(dest, 'runtime.png'),
      dest,
    );
  }
  writeFileSync(
    join(dest, 'measure.json'),
    JSON.stringify({ measured, compare, figmaBox, selector }, null, 2),
  );
  return { measured, compare };
}

async function captureDockOver(page, dest, figmaRel, figmaBox) {
  ensureDir(dest);
  if (figmaRel && figmaBox) {
    await cropPng(figmaRel, figmaBox, join(dest, 'figma.png'));
  }
  const clip = await page.evaluate(() => {
    const dock = document.querySelector('[data-testid="figma-floating-dock"]');
    if (!dock) return null;
    const r = dock.getBoundingClientRect();
    return {
      x: Math.max(0, r.x - 40),
      y: Math.max(0, r.y - 40),
      width: Math.min(390, r.width + 80),
      height: Math.min(860 - Math.max(0, r.y - 40), r.height + 80),
    };
  });
  await page.screenshot({
    path: join(dest, 'runtime.png'),
    clip,
    animations: 'disabled',
  });
  const measured = await measure(page);
  let compare = null;
  if (figmaRel && figmaBox) {
    try {
      compare = await overlayAndDiff(
        join(dest, 'figma.png'),
        join(dest, 'runtime.png'),
        dest,
      );
    } catch {
      compare = { note: 'raster sizes differ; geometry table is the source' };
    }
  }
  writeFileSync(
    join(dest, 'measure.json'),
    JSON.stringify({ measured, compare, figmaBox, clip }, null, 2),
  );
  return { measured, compare };
}

async function contactSheet(dirs, dest) {
  const tiles = [];
  for (const dir of dirs) {
    for (const name of ['figma.png', 'runtime.png', 'overlay.png', 'diff.png']) {
      const file = join(dir, name);
      try {
        tiles.push(
          await sharp(file).resize(195, 430, { fit: 'cover' }).png().toBuffer(),
        );
      } catch {
        tiles.push(
          await sharp({
            create: {
              width: 195,
              height: 430,
              channels: 3,
              background: '#dddddd',
            },
          })
            .png()
            .toBuffer(),
        );
      }
    }
  }
  const cols = 4;
  const rows = Math.ceil(tiles.length / cols);
  const composite = tiles.map((input, index) => ({
    input,
    left: (index % cols) * 195,
    top: Math.floor(index / cols) * 430,
  }));
  await sharp({
    create: {
      width: cols * 195,
      height: rows * 430,
      channels: 3,
      background: '#111111',
    },
  })
    .composite(composite)
    .png()
    .toFile(dest);
}

async function runEngine(browserType, engine, reduced) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: DPR,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  const root = join(
    OUT,
    `${engine}-${reduced ? 'reduced' : 'normal'}`,
  );
  ensureDir(root);
  const summary = { engine, reduced, states: {} };

  await openPage(page, '/seller/vex');
  summary.states.creatorWorks = await captureState(
    page,
    join(root, 'creator-works-expanded'),
    FIGMA_REFERENCES.creatorWorks,
    catalog.works.viewport,
  );

  const firstCard = page.locator('a[href="/product/figVexWk001"]').first();
  await firstCard.waitFor();
  summary.states.card366 = await captureElement(
    page,
    'a[href="/product/figVexWk001"]',
    join(root, 'work-card-366'),
    FIGMA_REFERENCES.creatorWorks,
    catalog.works.card366,
  );

  const offset = await compactOffset(page);
  summary.compactOffset = offset;
  for (const step of COMPACT_STEPS) {
    await setCreatorScroll(page, Math.round(offset * step));
    await page.waitForTimeout(80);
    const figmaRef =
      step === 1
        ? {
            rel: FIGMA_REFERENCES.creatorCompact,
            box: catalog.compact.viewport,
          }
        : {
            rel: FIGMA_REFERENCES.creatorWorks,
            box: catalog.works.viewport,
          };
    summary.states[`compact-${Math.round(step * 100)}`] = await captureState(
      page,
      join(root, `compact-${Math.round(step * 100)}`),
      figmaRef.rel,
      figmaRef.box,
    );
  }
  for (const step of [...COMPACT_STEPS].reverse()) {
    await setCreatorScroll(page, Math.round(offset * step));
    await page.waitForTimeout(80);
    const figmaRef =
      step === 1
        ? {
            rel: FIGMA_REFERENCES.creatorCompact,
            box: catalog.compact.viewport,
          }
        : {
            rel: FIGMA_REFERENCES.creatorWorks,
            box: catalog.works.viewport,
          };
    summary.states[`compact-reverse-${Math.round(step * 100)}`] =
      await captureState(
        page,
        join(root, `compact-reverse-${Math.round(step * 100)}`),
        figmaRef.rel,
        figmaRef.box,
      );
  }

  await setCreatorScroll(page, 0);
  await page.getByRole('tab', { name: 'Об авторе' }).click();
  await waitReady(page);
  summary.states.creatorAbout = await captureState(
    page,
    join(root, 'creator-about-expanded'),
    FIGMA_REFERENCES.creatorAbout,
    catalog.about.viewport,
  );

  await openPage(page, '/');
  summary.states.homeOpening = await captureState(
    page,
    join(root, 'home-opening'),
    FIGMA_REFERENCES.homeFold,
    catalog.homeFold.viewport,
  );
  summary.states.card264 = await captureElement(
    page,
    '#home-opening-work a[href^="/product/"]',
    join(root, 'work-card-264'),
    FIGMA_REFERENCES.card264,
    { x: 0, y: 0, width: 264, height: 352 },
  );

  await page.locator('#home-new-works').scrollIntoViewIfNeeded();
  await waitReady(page);
  summary.states.homeNewWorks = await captureState(
    page,
    join(root, 'home-new-works'),
    FIGMA_REFERENCES.homeLong,
    {
      x: 0,
      y: Math.max(0, catalog.homeLong.newWorks.y - 40),
      width: 390,
      height: 860,
    },
  );

  await page.evaluate(() => {
    const scroller = document.querySelector('[data-testid="home-scroll"]');
    if (scroller instanceof HTMLElement) scroller.scrollTop = 0;
  });
  summary.states.dockLight = await captureDockOver(
    page,
    join(root, 'dock-light'),
    FIGMA_REFERENCES.homeFold,
    { x: 0, y: 720, width: 390, height: 140 },
  );

  await page.locator('a[href="/product/figVexWk001"]').first().scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const dock = document.querySelector('[data-testid="figma-floating-dock"]');
    const card = document.querySelector('a[href="/product/figVexWk001"]');
    const scroller = document.querySelector('[data-testid="home-scroll"]');
    if (
      dock instanceof HTMLElement &&
      card instanceof HTMLElement &&
      scroller instanceof HTMLElement
    ) {
      const dockTop = dock.getBoundingClientRect().top;
      const cardTop = card.getBoundingClientRect().top;
      scroller.scrollTop += cardTop - dockTop + 80;
    }
  });
  await page.waitForTimeout(80);
  summary.states.dockDark = await captureDockOver(
    page,
    join(root, 'dock-dark'),
    FIGMA_REFERENCES.creatorWorks,
    { x: 0, y: 720, width: 390, height: 140 },
  );

  await page.locator('a[href="/product/figVexWk003"]').first().scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const dock = document.querySelector('[data-testid="figma-floating-dock"]');
    const card = document.querySelector('a[href="/product/figVexWk003"]');
    const scroller = document.querySelector('[data-testid="home-scroll"]');
    if (
      dock instanceof HTMLElement &&
      card instanceof HTMLElement &&
      scroller instanceof HTMLElement
    ) {
      const dockTop = dock.getBoundingClientRect().top;
      const cardTop = card.getBoundingClientRect().top;
      scroller.scrollTop += cardTop - dockTop + 80;
    }
  });
  await page.waitForTimeout(80);
  summary.states.dockColor = await captureDockOver(
    page,
    join(root, 'dock-color'),
    FIGMA_REFERENCES.creatorWorks,
    catalog.works.card366
      ? { x: 0, y: 720, width: 390, height: 140 }
      : catalog.homeFold.viewport,
  );

  const stateDirs = [
    'creator-works-expanded',
    'creator-about-expanded',
    'compact-0',
    'compact-25',
    'compact-50',
    'compact-75',
    'compact-100',
    'home-opening',
    'home-new-works',
    'work-card-264',
    'work-card-366',
    'dock-light',
    'dock-dark',
    'dock-color',
  ].map((name) => join(root, name));
  await contactSheet(stateDirs, join(root, 'contact-sheet.png'));

  await browser.close();
  writeFileSync(join(root, 'summary.json'), JSON.stringify(summary, null, 2));
  return summary;
}

function typeDelta(runtime, expected) {
  if (!runtime || !expected) return null;
  return {
    fontSize: runtime.fontSize,
    fontWeight: runtime.fontWeight,
    lineHeight: runtime.lineHeight,
    letterSpacing: runtime.letterSpacing,
    expected,
  };
}

function writeReport(results) {
  const chromiumNormal = results.find(
    (item) => item.engine === 'chromium' && !item.reduced,
  );
  const tab = chromiumNormal?.states.creatorWorks?.measured.worksTab;
  const count = chromiumNormal?.states.creatorWorks?.measured.tabCount;
  const dock = chromiumNormal?.states.creatorWorks?.measured.dock;
  const atmosphere = chromiumNormal?.states.creatorAbout?.measured.atmosphere;
  const card264 = chromiumNormal?.states.card264?.measured.openingCard;
  const card366 = chromiumNormal?.states.card366?.measured.cards?.[0];
  const report = `# Figma visual parity

Date: 2026-09-13  
Branch: \`fix/figma-visual-parity\`  
Stand: Expo \`${WEB}\`, API \`${API}\`, DB \`bidplace_figma_comparison_preview\`.  
No \`page.route\`. Viewport ${VIEW.width}×${VIEW.height}, DPR ${DPR}.

## Baseline measurements (Chromium, normal motion)

| Role | Runtime | Figma / token | Class |
|---|---|---|---|
| Dock surface | ${JSON.stringify(dock?.box)} pad ${dock?.padding} | 232×64, pad 14, gap 20 | do not shrink |
| Dock blur/fill | ${dock?.backdrop} / ${dock?.background} | blur 6, white 60% | product half-radius |
| Tab label | ${JSON.stringify(typeDelta(tab, { size: 16, weight: 500, tracking: -0.32 }))} | Inter Medium 16/−0.32 | measure |
| Tab count | ${JSON.stringify(typeDelta(count, { size: 12, weight: 400, lh: 14, tracking: -0.24 }))} | Regular 12/14/−0.24 | measure |
| Atmosphere | ${JSON.stringify(atmosphere?.box)} opacity ${atmosphere?.opacity} | 485×485 @ -47,-36, 40% wash, 0.5 | measure |
| Card 264 | ${JSON.stringify(card264)} | 264×352 | measure |
| Card 366 | ${JSON.stringify(card366)} | 366×488 | measure |

Raster overlays are evidence of geometry and visually significant zones. Full pixel equality across Chromium, WebKit and the Figma renderer is not required.

## Artifacts

\`${OUT}\`
`;
  writeFileSync(join(OUT, 'capture-summary.md'), report);
}

const engines = [
  [chromium, 'chromium'],
  [webkit, 'webkit'],
];

const results = [];
for (const [type, name] of engines) {
  for (const reduced of [false, true]) {
    console.log(`capturing ${name} reduced=${reduced}`);
    results.push(await runEngine(type, name, reduced));
  }
}
ensureDir(OUT);
writeFileSync(join(OUT, 'all-summaries.json'), JSON.stringify(results, null, 2));
writeReport(results);
console.log(`wrote ${join(OUT, 'REPORT.md')}`);

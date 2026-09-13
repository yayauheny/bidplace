import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const handoff = join(
  import.meta.dirname,
  '../../../../design/figma-handoff/portfolio-phone-v1',
);

export const FIGMA_SOURCES = {
  creatorWorks:
    'screens/creator/creator__works__390x2703__node-621-19820/nodes.json',
  creatorAbout:
    'screens/creator/creator__about__390x1609__node-621-19475/nodes.json',
  creatorCompact:
    'screens/creator/creator__scrolled__390x860__node-526-14482/nodes.json',
  homeFold: 'screens/home/home__first-fold__390x860__node-439-4404/nodes.json',
  homeLong: 'screens/home/home__default__390x3372__node-436-1137/nodes.json',
  card264: 'components/work-cover-card__264x352__node-874-5458/nodes.json',
};

export const FIGMA_REFERENCES = {
  creatorWorks:
    'screens/creator/creator__works__390x2703__node-621-19820/reference.png',
  creatorAbout:
    'screens/creator/creator__about__390x1609__node-621-19475/reference.png',
  creatorCompact:
    'screens/creator/creator__scrolled__390x860__node-526-14482/reference.png',
  homeFold: 'screens/home/home__first-fold__390x860__node-439-4404/reference.png',
  homeLong: 'screens/home/home__default__390x3372__node-436-1137/reference.png',
  card264: 'components/work-cover-card__264x352__node-874-5458/reference.png',
};

export function handoffPath(relative) {
  return join(handoff, relative);
}

export function loadFigmaTree(relative) {
  const root = JSON.parse(readFileSync(handoffPath(relative), 'utf8'));
  const parents = new Map();
  const byId = new Map();

  const visit = (node, parent = null) => {
    byId.set(node.id, node);
    if (parent) parents.set(node.id, parent);
    for (const child of node.children ?? []) visit(child, node);
  };
  visit(root);
  return { root, byId, parents };
}

export function localBox(node, tree) {
  if (!node) return null;
  let x = 0;
  let y = 0;
  let current = node;
  while (current && current !== tree.root) {
    x += current.layout?.x ?? 0;
    y += current.layout?.y ?? 0;
    current = tree.parents.get(current.id);
  }
  return {
    id: node.id,
    name: node.name,
    x,
    y,
    width: node.layout?.width ?? 0,
    height: node.layout?.height ?? 0,
    font: node.style?.font ?? node.style?.text ?? null,
    letterSpacing: node.style?.letterSpacing ?? null,
    fills: node.style?.fills ?? null,
    effects: node.style?.effects ?? node.effects ?? null,
  };
}

export function figmaPxLetterSpacing(fontSize, raw) {
  if (raw == null || typeof raw !== 'object') return null;
  if (raw.unit === 'PERCENT' || raw.units === 'PERCENT') {
    return (fontSize * raw.value) / 100;
  }
  return raw.value ?? null;
}

export function geometryCatalog() {
  const works = loadFigmaTree(FIGMA_SOURCES.creatorWorks);
  const about = loadFigmaTree(FIGMA_SOURCES.creatorAbout);
  const compact = loadFigmaTree(FIGMA_SOURCES.creatorCompact);
  const homeFold = loadFigmaTree(FIGMA_SOURCES.homeFold);
  const homeLong = loadFigmaTree(FIGMA_SOURCES.homeLong);
  const card264 = loadFigmaTree(FIGMA_SOURCES.card264);

  return {
    works: {
      tree: works,
      viewport: { x: 0, y: 0, width: 390, height: 860 },
      atmosphere: localBox(works.byId.get('621:19821'), works),
      card366: localBox(works.byId.get('621:19881'), works),
      frost366: localBox(works.byId.get('621:19888'), works),
      tabs: localBox(works.byId.get('621:19868'), works),
      tabLabel: localBox(works.byId.get('621:19870'), works),
      tabCount: localBox(works.byId.get('621:19871'), works),
      dock288: localBox(works.byId.get('621:19947'), works),
    },
    about: {
      tree: about,
      viewport: { x: 0, y: 0, width: 390, height: 860 },
      atmosphere: localBox(about.byId.get('621:19476'), about),
      handle: localBox(about.byId.get('621:19483'), about),
      tabLabel: localBox(about.byId.get('621:19524'), about),
      tabCount: localBox(about.byId.get('621:19525'), about),
    },
    compact: {
      tree: compact,
      viewport: { x: 0, y: 0, width: 390, height: 860 },
      handle: localBox(compact.byId.get('526:14524'), compact),
    },
    homeFold: {
      tree: homeFold,
      viewport: { x: 0, y: 0, width: 390, height: 860 },
      title: localBox(homeFold.byId.get('439:4408'), homeFold),
      card264: localBox(homeFold.byId.get('439:4422'), homeFold),
      dock232: localBox(homeFold.byId.get('439:4633'), homeFold),
    },
    homeLong: {
      tree: homeLong,
      viewport: { x: 0, y: 0, width: 390, height: 860 },
      newWorks: localBox(homeLong.byId.get('436:1275'), homeLong),
      card366: localBox(homeLong.byId.get('436:1276'), homeLong),
    },
    card264: {
      tree: card264,
      viewport: {
        x: 0,
        y: 0,
        width: card264.root.layout.width,
        height: card264.root.layout.height,
      },
    },
  };
}

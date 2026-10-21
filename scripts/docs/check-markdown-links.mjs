#!/usr/bin/env node
/**
 * Validates relative Markdown links and #anchors under docs/, README.md, AGENTS.md.
 * Usage: node scripts/docs/check-markdown-links.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const ENTRY_PATHS = [
  'README.md',
  'AGENTS.md',
  'apps/mobile/AGENTS.md',
  path.join('docs'),
];

const LINK_RE = /!?\[[^\]]*]\(([^)]+)\)/g;

function githubSlug(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/[—–]/g, '-')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function collectMarkdownFiles() {
  const files = new Set();
  for (const entry of ENTRY_PATHS) {
    const abs = path.join(ROOT, entry);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isFile()) {
      files.add(abs);
      continue;
    }
    for (const rel of walkDir(abs)) {
      if (rel.endsWith('.md')) files.add(path.join(abs, rel));
    }
  }
  return [...files].sort();
}

function walkDir(dir, prefix = '') {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const rel = prefix ? `${prefix}/${name}` : name;
    const abs = path.join(dir, name);
    if (fs.statSync(abs).isDirectory()) out.push(...walkDir(abs, rel));
    else out.push(rel);
  }
  return out;
}

function headingIds(content) {
  const ids = new Set();
  for (const line of content.split('\n')) {
    const m = /^#{1,6}\s+(.+?)\s*$/.exec(line);
    if (m) ids.add(githubSlug(m[1]));
  }
  return ids;
}

function decodeUri(p) {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

const errors = [];

for (const file of collectMarkdownFiles()) {
  const content = fs.readFileSync(file, 'utf8');
  const baseDir = path.dirname(file);
  let match;
  LINK_RE.lastIndex = 0;
  while ((match = LINK_RE.exec(content)) !== null) {
    let raw = match[1].trim();
    if (!raw || raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('mailto:')) {
      continue;
    }
    if (raw.startsWith('<') && raw.endsWith('>')) raw = raw.slice(1, -1);
    const [target, anchor] = raw.split('#');
    if (!target) {
      if (anchor) {
        const ids = headingIds(content);
        const id = decodeUri(anchor).toLowerCase();
        if (!ids.has(id)) {
          errors.push({ file, link: raw, reason: `missing anchor #${anchor} in same file` });
        }
      }
      continue;
    }
    const resolved = path.normalize(path.join(baseDir, decodeUri(target)));
    if (!resolved.startsWith(ROOT)) {
      errors.push({ file, link: raw, reason: 'link escapes repository root' });
      continue;
    }
    if (!fs.existsSync(resolved)) {
      errors.push({ file, link: raw, reason: `target missing: ${path.relative(ROOT, resolved)}` });
      continue;
    }
    if (anchor && fs.statSync(resolved).isFile()) {
      const ids = headingIds(fs.readFileSync(resolved, 'utf8'));
      const id = decodeUri(anchor).toLowerCase();
      if (!ids.has(id)) {
        errors.push({
          file,
          link: raw,
          reason: `missing anchor #${anchor} in ${path.relative(ROOT, resolved)}`,
        });
      }
    }
  }
}

if (errors.length) {
  console.error(`Markdown link check failed (${errors.length}):`);
  for (const e of errors) {
    console.error(`- ${path.relative(ROOT, e.file)}: (${e.link}) — ${e.reason}`);
  }
  process.exit(1);
}

console.log(`Markdown link check passed (${collectMarkdownFiles().length} files).`);

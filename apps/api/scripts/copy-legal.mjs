import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Run after nest build. Source of truth stays in docs/legal/site.
const root = resolve(import.meta.dirname, '../../..');
const from = resolve(root, 'docs/legal/site');
const to = resolve(root, 'apps/api/dist/auth/legal');
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });

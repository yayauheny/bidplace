import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Copy canonical source files into the compiled API artifact.
const root = resolve(import.meta.dirname, '../../..');
const from = resolve(root, 'docs/legal/site');
const to = resolve(root, 'apps/api/dist/auth/legal');
mkdirSync(to, { recursive: true });
for (const filename of [
  '01-user-agreement.md',
  '02-privacy-policy.md',
  '03-pd-consent.md',
  '04-author-rules.md',
  '06-prohibited.md',
]) {
  copyFileSync(resolve(from, filename), resolve(to, filename));
}

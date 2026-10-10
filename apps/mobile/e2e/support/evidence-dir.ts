import { resolve } from 'node:path';

const override = process.env.E2E_EVIDENCE_DIR?.trim();

export const e2eEvidenceDir = override
  ? resolve(override)
  : resolve('/tmp/bidplace-mobile-web-figma-evidence');

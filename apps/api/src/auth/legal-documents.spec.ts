import { ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readPublishedLegalDocuments } from './legal-documents';

const fixture = vi.hoisted(() => ({
  available: true,
  body: (_path: string) => 'Редакция: `portfolio-legal-2026-10-12`\n\nДокумент.',
}));

vi.mock('node:fs', () => ({
  existsSync: () => fixture.available,
  readFileSync: (path: string) => fixture.body(path),
}));

describe('published legal documents', () => {
  beforeEach(() => {
    fixture.available = true;
    fixture.body = () => 'Редакция: `portfolio-legal-2026-10-12`\n\nДокумент.';
  });

  it('exposes five documents with their source version', () => {
    const result = readPublishedLegalDocuments();
    expect(result.version).toBe('portfolio-legal-2026-10-12');
    expect(result.documents.map((doc) => doc.id)).toEqual([
      'agreement', 'privacy', 'data-consent', 'author-rules', 'prohibited',
    ]);
    expect(result.documents.every((doc) => doc.version === result.version)).toBe(true);
  });

  it('fails closed when no packaged documents are present', () => {
    fixture.available = false;
    expect(() => readPublishedLegalDocuments()).toThrow(ServiceUnavailableException);
  });

  it('fails closed on incomplete operator details rather than publishing template text', () => {
    fixture.body = () => 'Редакция: `portfolio-legal-2026-10-12`\n\n[УНП]';
    expect(() => readPublishedLegalDocuments()).toThrow(ServiceUnavailableException);
  });

  it('rejects inconsistent versions among the canonical files', () => {
    fixture.body = (path: string) =>
      path.endsWith('02-privacy-policy.md')
        ? 'Редакция: `different-version`\n\nДокумент.'
        : 'Редакция: `portfolio-legal-2026-10-12`\n\nДокумент.';
    expect(() => readPublishedLegalDocuments()).toThrow(ServiceUnavailableException);
  });
});

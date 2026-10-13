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
    expect(result.version).toMatch(/^portfolio-legal-2026-10-12\+[a-f0-9]{32}$/);
    expect(result.documents.map((doc) => doc.id)).toEqual([
      'agreement', 'privacy', 'data-consent', 'author-rules', 'prohibited',
    ]);
    expect(result.documents.every((doc) => doc.version === result.version)).toBe(true);
  });

  it('changes the accepted version if any document body changes without edition bump', () => {
    const oldVersion = readPublishedLegalDocuments().version;
    fixture.body = (path: string) =>
      path.endsWith('03-pd-consent.md')
        ? 'Редакция: `portfolio-legal-2026-10-12`\n\nДополнено.'
        : 'Редакция: `portfolio-legal-2026-10-12`\n\nДокумент.';
    expect(readPublishedLegalDocuments().version).not.toBe(oldVersion);
  });

  it('fails closed if a canonical source contains an unresolved lowercase placeholder', () => {
    fixture.body = () => 'Редакция: `portfolio-legal-2026-10-12`\n\n[не заполнено]';
    expect(() => readPublishedLegalDocuments()).toThrow(ServiceUnavailableException);
  });

  it('fails closed when a source cannot be read after the availability check', () => {
    fixture.body = () => { throw new Error('ENOENT'); };
    expect(() => readPublishedLegalDocuments()).toThrow(ServiceUnavailableException);
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

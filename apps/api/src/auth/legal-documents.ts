import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { ServiceUnavailableException } from '@nestjs/common';
import type { LegalDocumentsResponse } from '@bidplace/contracts';

const documents = [
  { id: 'agreement', filename: '01-user-agreement.md', title: 'Пользовательское соглашение' },
  { id: 'privacy', filename: '02-privacy-policy.md', title: 'Политика персональных данных и cookies' },
  { id: 'data-consent', filename: '03-pd-consent.md', title: 'Согласие на обработку персональных данных' },
  { id: 'author-rules', filename: '04-author-rules.md', title: 'Правила авторов' },
  { id: 'prohibited', filename: '06-prohibited.md', title: 'Запрещённый контент и обращения правообладателей' },
] as const;

// Canonical source: docs/legal/site/*.md. Build copies them into dist/auth/legal.
// A source checkout is supported for local development and tests.
const directories = [
  resolve(__dirname, 'legal'),
  resolve(process.cwd(), '../../docs/legal/site'),
  resolve(process.cwd(), 'docs/legal/site'),
];

function notPublished(): never {
  throw new ServiceUnavailableException('Legal documents are not published');
}

export function readPublishedLegalDocuments(): LegalDocumentsResponse {
  const directory = directories.find((candidate) =>
    documents.every(({ filename }) => existsSync(join(candidate, filename))),
  );
  if (!directory) return notPublished();

  const entries = documents.map(({ id, filename, title }) => {
    const markdown = readFileSync(join(directory, filename), 'utf8');
    const version = /^Редакция:\s*`([^`]+)`/m.exec(markdown)?.[1];
    // Never send unresolved operator/provider/analytics placeholders to the public.
    if (!version || /\[[А-ЯЁ][А-ЯЁ0-9\s,.:/–—-]*\]/u.test(markdown)) {
      return notPublished();
    }
    return { id, version, title, markdown };
  });

  const version = entries[0]?.version;
  if (!version || entries.some((entry) => entry.version !== version)) return notPublished();
  return { version, documents: entries };
}

import { createHash } from 'node:crypto';
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

// docs/legal/site is the canonical source; the API build packages the same files
// under dist/auth/legal. Do not publish the handoff, drafts or deferred documents.
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

  try {
    const entries = documents.map(({ id, filename, title }) => {
      const markdown = readFileSync(join(directory, filename), 'utf8');
      const edition = /^Редакция:\s*`([^`]+)`/m.exec(markdown)?.[1];
      // A missing or unresolved legal entity / transfer / analytics fact
      // must never be exposed publicly as an actual policy.
      if (
        !edition ||
        !/^portfolio-legal-[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(edition) ||
        /\[[^\]\r\n]{1,150}\](?!\()/u.test(markdown)
      ) {
        return notPublished();
      }
      return { id, edition, title, markdown };
    });

    const edition = entries[0]?.edition;
    if (!edition || entries.some((entry) => entry.edition !== edition)) return notPublished();

    // A textual edition alone does not prove the exact displayed content.
    // A deterministic digest changes even when someone edits the Markdown
    // without updating its human-readable edition. This is stored as evidence.
    const hash = createHash('sha256');
    for (const entry of entries) {
      hash.update(entry.id);
      hash.update('\0');
      hash.update(entry.markdown);
      hash.update('\0');
    }
    const version = `${edition}+${hash.digest('hex').slice(0, 32)}`;
    return {
      version,
      documents: entries.map(({ id, title, markdown }) => ({
        id,
        title,
        markdown,
        version,
      })),
    };
  } catch (error) {
    if (error instanceof ServiceUnavailableException) throw error;
    return notPublished();
  }
}

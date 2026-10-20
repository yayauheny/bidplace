import type { Page } from '@playwright/test';

// Registration is gated by GET /api/auth/legal: five published documents and
// one explicit combined confirmation. The dev stand intentionally refuses to serve
// documents while the legal entity placeholder is unresolved, so layout and
// flow specs stub the endpoint instead of seeding the database.
const FIXTURE_VERSION = 'e2e-fixture';

const FIXTURE_DOCUMENTS = [
  ['agreement', 'Пользовательское соглашение'],
  ['privacy', 'Политика персональных данных и cookies'],
  ['data-consent', 'Согласие на обработку персональных данных'],
  ['author-rules', 'Правила авторов'],
  ['prohibited', 'Запрещённый контент и обращения правообладателей'],
] as const;

export async function installLegalDocumentsFixture(page: Page) {
  await page.route('**/api/auth/legal', (route) =>
    route.fulfill({
      json: {
        version: FIXTURE_VERSION,
        documents: FIXTURE_DOCUMENTS.map(([id, title]) => ({
          id,
          title,
          version: FIXTURE_VERSION,
          markdown: `Текст документа «${title}» тестовой среды.`,
        })),
      },
    }),
  );
}

export async function acceptRegistrationConsents(page: Page) {
  await page.getByRole('checkbox', { name: /^Мне есть 18 лет/ }).check();
}

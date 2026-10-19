import type { Page } from '@playwright/test';

// Registration is gated by GET /api/auth/legal: five published documents and
// four named consent checkboxes. The dev stand intentionally refuses to serve
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

const CONSENT_LABELS = [
  'Я принимаю пользовательское соглашение bidplace',
  'Я ознакомился с политикой персональных данных и cookies',
  'Я даю согласие на обработку данных для основной услуги bidplace',
  'Мне исполнилось 18 лет',
] as const;

export async function acceptRegistrationConsents(page: Page) {
  for (const label of CONSENT_LABELS) {
    await page.getByRole('checkbox', { name: label, exact: true }).check();
  }
}

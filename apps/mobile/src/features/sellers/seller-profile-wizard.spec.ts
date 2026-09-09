import { describe, expect, it } from 'vitest';

import {
  authorApplicationStep,
  authorApplicationStepCount,
  authorApplicationStepDescriptions,
  authorApplicationStepTitles,
} from './seller-profile-wizard';

describe('author application wizard', () => {
  it('uses four Figma screens and keeps handoff private', () => {
    expect(authorApplicationStepCount).toBe(4);
    expect(authorApplicationStepTitles[authorApplicationStep.identity]).toBe(
      'Основная информация',
    );
    expect(authorApplicationStepTitles[authorApplicationStep.about]).toBe(
      'Раскройте себя как автора',
    );
    expect(authorApplicationStepTitles[authorApplicationStep.contacts]).toBe(
      'Контакты',
    );
    expect(authorApplicationStepTitles[authorApplicationStep.handoff]).toBe(
      'Закрытый контакт',
    );
    expect(
      authorApplicationStepDescriptions[authorApplicationStep.contacts],
    ).not.toMatch(/покупател/i);
    expect(
      authorApplicationStepDescriptions[authorApplicationStep.handoff],
    ).toMatch(/не публикуется/);
  });
});

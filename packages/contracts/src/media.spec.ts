import { describe, expect, it } from 'vitest';
import { publicMediaUrlSchema } from './media';
describe('public media contract', () => {
  it('accepts only HTTPS derivative paths', () => {
    const path = '/assets/11111111-1111-4111-a111-111111111111/p1/preview.webp';
    expect(
      publicMediaUrlSchema.safeParse(`https://media.example.com${path}`)
        .success,
    ).toBe(true);
    for (const value of [
      `http://media.example.com${path}`,
      `https://example.r2.dev${path}`,
      `https://media.example.com${path}?token=private`,
      'https://media.example.com/assets/11111111-1111-4111-a111-111111111111/source.jpeg',
    ])
      expect(publicMediaUrlSchema.safeParse(value).success).toBe(false);
  });
});

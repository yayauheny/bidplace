import { describe, expect, it } from 'vitest';
import { publicShareTarget } from './public-share';

describe('public share target', () => {
  it.each(['/authors/vex', '/authors/bala_klava', '/works/daliEstate1'])('keeps %s on the current origin with a PNG filename', (path) => {
    expect(publicShareTarget(path, 'https://bidplace.test')).toEqual({
      url: `https://bidplace.test${path}`,
      filename: `bidplace-${path.split('/').at(-1)}.png`,
    });
  });
  it.each(['https://other.test/authors/anna', '//other.test', '/admin', '/authors/anna?email=x', '/works/../admin', '/works/short'])('rejects %s', (path) => {
    expect(() => publicShareTarget(path, 'https://bidplace.test')).toThrow('Invalid public share path');
  });
});

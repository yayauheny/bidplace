import { describe, expect, it } from 'vitest';

import { authorAtmosphereSpec } from './author-atmosphere-style';

describe('Author atmosphere', () => {
  it('matches the captured 485px avatar-derived layer', () => {
    expect(authorAtmosphereSpec()).toEqual({
      sourceNodeId: '621:19476',
      width: 485,
      height: 485,
      left: -47,
      top: -36,
      opacity: 0.5,
      blur: 40,
      bottomRadius: 200,
      wash: 'rgba(255, 255, 255, 0.40)',
    });
  });
});

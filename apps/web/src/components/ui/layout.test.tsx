import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Heading } from './layout';

describe('Heading', () => {
  it('renders semantic heading elements', () => {
    render(<Heading level="display">Главный заголовок</Heading>);

    expect(
      screen.getByRole('heading', { name: 'Главный заголовок', level: 1 }),
    ).toBeInTheDocument();
  });
});

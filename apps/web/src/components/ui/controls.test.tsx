import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PrimaryButton, TextField } from './controls';

describe('controls', () => {
  it('exposes description and error relationships for text fields', () => {
    render(
      <TextField
        label="Email"
        description="Мы используем этот адрес только для уведомлений"
        error="Введите корректный email"
      />,
    );

    const field = screen.getByRole('textbox', { name: 'Email' });

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Мы используем этот адрес только для уведомлений')).toBeInTheDocument();
    expect(screen.getByText('Введите корректный email')).toHaveAttribute('role', 'alert');
  });

  it('shows a visible focus state for buttons', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();

    render(<PrimaryButton onPress={handler}>Сохранить</PrimaryButton>);

    const button = screen.getByRole('button', { name: 'Сохранить' });

    await user.tab();

    expect(button).toHaveFocus();
    expect(button).toHaveStyle('outline: 2px solid var(--focusring)');
  });
});

import '@testing-library/jest-dom/vitest';
import { createElement, type ReactNode } from 'react';
import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    createElement('a', { href, ...props }, children)
  ),
}));

import { createElement, type ReactNode } from 'react';

export function Portal({ children }: { children?: ReactNode }) {
  return createElement('div', null, children);
}

export function PortalHost() {
  return null;
}

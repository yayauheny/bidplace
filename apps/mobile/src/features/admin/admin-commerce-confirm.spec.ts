/** @vitest-environment jsdom */
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { adminKeys, advanceAuthEpoch, authKeys } from '../../lib/query-cache';
import { AdminCommerceScreen } from './admin-commerce-screen';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const mocks = vi.hoisted(() => ({ ban: vi.fn(), lookup: vi.fn() }));
vi.mock('react-native', () => ({ View: ({ children }: { children: ReactNode }) => createElement('div', null, children), ScrollView: ({ children }: { children: ReactNode }) => createElement('div', null, children) }));
vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../../components/layout', () => ({ AppShell: ({ children }: { children: ReactNode }) => createElement('div', null, children) }));
vi.mock('../../components/layout/use-dock-inset', () => ({ useDockInset: () => ({ reserve: 0 }) }));
vi.mock('../auth/AccountLogoutButton', () => ({ AccountLogoutButton: () => null }));
vi.mock('../../components/ui', () => {
  const Button = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => createElement('button', { onClick: onPress, disabled }, label);
  return {
    AppText: ({ children }: { children: ReactNode }) => createElement('span', null, children),
    AppDialog: ({ open, children }: { open: boolean; children: ReactNode }) => open ? createElement('div', { role: 'dialog' }, children) : null,
    PageHeader: () => null, PrimaryButton: Button, SecondaryButton: Button, TextButton: Button,
    TextField: ({ onChangeText }: { onChangeText: (value: string) => void }) => createElement('button', { onClick: () => onChangeText('Причина') }, 'Указать причину'),
  };
});
vi.mock('../../providers/api-provider', () => ({ useApiClient: () => ({
  admin: { lookupUsers: mocks.lookup },
  commerce: {
    getAdminHealth: async () => null,
    getAdminAttention: async () => ({ reportedOrders: [], unmarkedOrders: [], blocks: [] }),
    listReports: async () => ({ reports: [{ id: 'report1', orderPublicId: 'order1', reason: 'OTHER', status: 'OPEN', buyerUserId: 'buyer1', sellerUserId: 'seller1', text: null }] }),
    getOrder: async () => ({ publicId: 'order1', workTitle: 'Work', status: 'ACTIVE', buyerContacts: { email: 'buyer@example.invalid' }, sellerContacts: { email: 'seller@example.invalid' } }),
    banUser: mocks.ban,
  },
}) }));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
let root: ReturnType<typeof createRoot> | undefined;
let host: HTMLDivElement;
function click(label: string) {
  const button = [...host.querySelectorAll('button')].find((item) => item.textContent === label);
  expect(button, label).toBeDefined();
  act(() => button?.click());
}
afterEach(() => { act(() => root?.unmount()); root = undefined; client.clear(); host.remove(); mocks.ban.mockReset(); mocks.lookup.mockReset(); });
async function render() {
  client.setQueryData(authKeys.session, { id: 'admin' });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => { root?.render(createElement(QueryClientProvider, { client, children: createElement(AdminCommerceScreen) })); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
  click('Указать причину');
}

it('shows the exact target and reason and sends only after confirmation', async () => {
  mocks.ban.mockResolvedValue({ ok: true });
  await render();
  click('Заблокировать покупателя');
  expect(mocks.ban).not.toHaveBeenCalled();
  expect(host.querySelector('[role="dialog"]')?.textContent).toContain('Покупатель: buyer1');
  expect(host.querySelector('[role="dialog"]')?.textContent).toContain('Причина: Причина');
  const confirm = [...host.querySelectorAll('button')].find((button) => button.textContent === 'Заблокировать');
  act(() => { confirm?.click(); confirm?.click(); });
  await act(async () => { await Promise.resolve(); });
  expect(mocks.ban).toHaveBeenCalledTimes(1);
  expect(mocks.ban).toHaveBeenCalledWith('buyer1', { reason: 'Причина' });
});

it('does not ban after cancellation, session retirement or selection change', async () => {
  await render();
  click('Заблокировать автора');
  click('Отмена');
  expect(mocks.ban).not.toHaveBeenCalled();
  click('Заблокировать автора');
  advanceAuthEpoch(client);
  click('Заблокировать');
  expect(mocks.ban).not.toHaveBeenCalled();
  click('Отмена');
  click('Заблокировать автора');
  click('Открыть сделку');
  expect(host.querySelector('[role="dialog"]')).toBeNull();
  expect(mocks.ban).not.toHaveBeenCalled();
});


it('does not send an email-based ban after the selected user changes during lookup', async () => {
  let resolveLookup: (value: { users: { id: string }[] }) => void = () => {};
  mocks.lookup.mockImplementation(() => new Promise((resolve) => { resolveLookup = resolve; }));
  await render();
  click('Открыть сделку');
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
  click('Заблокировать покупателя по адресу сделки');
  expect(host.querySelector('[role="dialog"]')?.textContent).toContain('buyer@example.invalid');
  expect(mocks.lookup).not.toHaveBeenCalled();
  click('Заблокировать');
  expect(mocks.lookup).toHaveBeenCalledTimes(1);
  client.setQueryData(adminKeys.commerce('order:order1'), { publicId: 'order1', buyerContacts: { email: 'other@example.invalid' } });
  resolveLookup({ users: [{ id: 'buyer1' }] });
  await act(async () => { await Promise.resolve(); });
  expect(mocks.ban).not.toHaveBeenCalled();
});


it('does not ban when the selected report points to another user before confirmation', async () => {
  await render();
  click('Заблокировать покупателя');
  client.setQueryData(adminKeys.commerce('reports'), { reports: [{ id: 'report1', orderPublicId: 'order1', reason: 'OTHER', status: 'OPEN', buyerUserId: 'buyer2', sellerUserId: 'seller1', text: null }] });
  click('Заблокировать');
  expect(mocks.ban).not.toHaveBeenCalled();
});

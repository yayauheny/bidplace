import { ApiClientError } from '@bidplace/api-client';
import { describe, expect, it } from 'vitest';

import {
  dealContactPatch,
  dealContactsLoginPath,
  dealContactsRedirect,
  draftFromContacts,
  submitDealContacts,
} from './deal-contacts';

const loaded = {
  phone: '+375291112233',
  telegram: '@deal_owner',
  instagram: null,
  vk: null,
  showToBuyer: null as boolean | null,
};

describe('deal contact redirect', () => {
  it('defaults to settings and rejects external paths', () => {
    expect(dealContactsRedirect(undefined)).toBe('/account/settings');
    expect(dealContactsRedirect('')).toBe('/account/settings');
    expect(dealContactsRedirect('   ')).toBe('/account/settings');
    expect(dealContactsRedirect('https://evil.example/profile')).toBe(
      '/account/settings',
    );
    expect(dealContactsRedirect('//evil.example/profile')).toBe(
      '/account/settings',
    );
    expect(dealContactsRedirect('/login')).toBe('/account/settings');
    expect(dealContactsRedirect('/product/abc')).toBe('/product/abc');
    expect(dealContactsRedirect(['/product/abc', '/other'])).toBe('/product/abc');
  });

  it('returns to the contacts form without putting contact values in the path', () => {
    expect(dealContactsLoginPath('/account/settings')).toBe('/account/contacts');
    expect(dealContactsLoginPath('/product/abc')).toBe(
      '/account/contacts?redirectTo=%2Fproduct%2Fabc',
    );
    expect(dealContactsLoginPath('/product/abc')).not.toContain('+375');
  });
});

describe('deal contact patch', () => {
  it('omits untouched fields and clears an emptied field', () => {
    const draft = draftFromContacts(loaded);
    expect(dealContactPatch(loaded, draft)).toBeNull();
    expect(
      dealContactPatch(loaded, { ...draft, phone: '  ' }),
    ).toEqual({ phone: null });
    expect(
      dealContactPatch(loaded, { ...draft, vk: '@deal_buyer' }),
    ).toEqual({ vk: '@deal_buyer' });
    expect(
      dealContactPatch(
        { ...loaded, showToBuyer: true },
        { ...draft, showToBuyer: false },
      ),
    ).toEqual({ showToBuyer: false });
    expect(
      dealContactPatch(loaded, { ...draft, showToBuyer: false }),
    ).toBeNull();
  });

  it('rejects a bad phone before the request and sends a stale session to login once', async () => {
    const update = async () => loaded;
    const invalid = await submitDealContacts({
      loaded,
      draft: { ...draftFromContacts(loaded), phone: '123' },
      stillOwns: () => true,
      update,
    });
    expect(invalid).toMatchObject({ kind: 'invalid', field: 'phone' });

    let calls = 0;
    const stale = await submitDealContacts({
      loaded,
      draft: { ...draftFromContacts(loaded), phone: '' },
      stillOwns: () => true,
      update: async () => {
        calls += 1;
        throw new ApiClientError('stale', { kind: 'unauthorized', status: 401 });
      },
    });
    expect(stale.kind).toBe('stale-session');
    expect(calls).toBe(1);

    const dropped = await submitDealContacts({
      loaded,
      draft: { ...draftFromContacts(loaded), phone: '' },
      stillOwns: () => false,
      update: async () => loaded,
    });
    expect(dropped.kind).toBe('dropped');
  });
});

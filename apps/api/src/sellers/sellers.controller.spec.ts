import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { SellersController } from './sellers.controller';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function responseMock() {
  let body: Buffer | undefined;
  const headers = new Map<string, string>();
  return {
    statusCode: 200,
    headers,
    setHeader: (name: string, value: string) => headers.set(name, value),
    type: vi.fn(),
    send: (value: Buffer) => {
      body = value;
    },
    get body() {
      return body;
    },
  };
}

describe('SellersController photo binary response', () => {
  it('sends an approved public profile photo as PNG bytes', async () => {
    const sellers = {
      getPhoto: vi.fn().mockResolvedValue({
        status: 'APPROVED',
        isPublic: true,
        profilePhotoMimeType: 'image/png',
        profilePhotoData: new Uint8Array(png),
      }),
    };
    const controller = new SellersController(sellers as never);
    const response = responseMock();

    await controller.getPhoto('seller-slug', undefined, response);

    expect(response.statusCode).toBe(200);
    expect(response.type).toHaveBeenCalledWith('image/png');
    expect(response.body).toEqual(png);
    expect(response.body?.subarray(0, 8)).toEqual(png);
    expect(response.body?.toString('utf8').startsWith('{')).toBe(false);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, must-revalidate',
    );
  });

  it('does not expose a private profile photo to an anonymous request', async () => {
    const sellers = {
      getPhoto: vi.fn().mockRejectedValue(new NotFoundException()),
    };
    const controller = new SellersController(sellers as never);

    await expect(
      controller.getPhoto('private-seller', undefined, responseMock()),
    ).rejects.toThrow(NotFoundException);
    expect(sellers.getPhoto).toHaveBeenCalledWith(
      'private-seller',
      undefined,
      undefined,
    );
  });

  it('does not cache an approved but non-public photo read by an administrator', async () => {
    const sellers = {
      getPhoto: vi.fn().mockResolvedValue({
        status: 'APPROVED',
        isPublic: false,
        profilePhotoMimeType: 'image/png',
        profilePhotoData: new Uint8Array(png),
      }),
    };
    const response = responseMock();
    await new SellersController(sellers as never).getPhoto(
      'banned-author', { sub: 'admin-id', role: 'admin' }, response,
    );
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});

describe('SellersController profile write body', () => {
  const multipart = { headers: { 'content-type': 'multipart/form-data; boundary=x' } };
  const json = { headers: { 'content-type': 'application/json' } };
  const auth = { sub: 'user-id' };

  function sellersMock() {
    return {
      update: vi.fn().mockResolvedValue({ sellerProfile: {} }),
      create: vi.fn().mockResolvedValue({ sellerProfile: {} }),
    };
  }

  it('passes an explicit null city from the multipart data part to the service', async () => {
    const sellers = sellersMock();
    const controller = new SellersController(sellers as never);

    await controller.update(
      auth,
      multipart,
      { data: JSON.stringify({ city: null, fullName: 'Synthetic Author' }) },
      [],
    );

    expect(sellers.update).toHaveBeenCalledWith(
      'user-id',
      { city: null, fullName: 'Synthetic Author' },
      undefined,
    );
  });

  it('rejects a multipart write without the data part instead of reading top-level fields', async () => {
    const sellers = sellersMock();
    const controller = new SellersController(sellers as never);

    await expect(
      controller.update(auth, multipart, { city: '' }, []),
    ).rejects.toThrow();
    expect(sellers.update).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON in the multipart data part', async () => {
    const sellers = sellersMock();
    const controller = new SellersController(sellers as never);

    await expect(
      controller.update(auth, multipart, { data: '{"city":' }, []),
    ).rejects.toThrow(BadRequestException);
    expect(sellers.update).not.toHaveBeenCalled();
  });

  it('rejects unknown fields beside the data part', async () => {
    const sellers = sellersMock();
    const controller = new SellersController(sellers as never);

    await expect(
      controller.update(
        auth,
        multipart,
        { data: JSON.stringify({ fullName: 'A' }), city: 'Minsk' },
        [],
      ),
    ).rejects.toThrow();
    expect(sellers.update).not.toHaveBeenCalled();
  });

  it('keeps the JSON body contract: an empty city string is still rejected', async () => {
    const sellers = sellersMock();
    const controller = new SellersController(sellers as never);

    await expect(
      controller.update(auth, json, { city: '' }, []),
    ).rejects.toThrow();
    expect(sellers.update).not.toHaveBeenCalled();
  });

  it('passes a JSON body through without a data envelope', async () => {
    const sellers = sellersMock();
    const controller = new SellersController(sellers as never);

    await controller.update(auth, json, { country: 'BY', city: null }, []);

    expect(sellers.update).toHaveBeenCalledWith(
      'user-id',
      { country: 'BY', city: null },
      undefined,
    );
  });
});

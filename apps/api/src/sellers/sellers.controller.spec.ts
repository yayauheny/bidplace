import { NotFoundException } from '@nestjs/common';
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
});

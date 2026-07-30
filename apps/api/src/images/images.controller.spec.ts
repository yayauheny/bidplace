import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ImagesController } from './images.controller';

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

describe('ImagesController binary response', () => {
  it('sends approved public media as PNG bytes', async () => {
    const images = {
      get: vi.fn().mockResolvedValue({
        data: new Uint8Array(png),
        mimeType: 'image/png',
        product: { status: 'APPROVED' },
      }),
    };
    const controller = new ImagesController(images as never);
    const response = responseMock();

    await controller.get('image-id', undefined, response);

    expect(response.statusCode).toBe(200);
    expect(response.type).toHaveBeenCalledWith('image/png');
    expect(response.body).toEqual(png);
    expect(response.body?.subarray(0, 8)).toEqual(png);
    expect(response.body?.toString('utf8').startsWith('{')).toBe(false);
  });

  it('does not expose private media to an anonymous request', async () => {
    const images = { get: vi.fn().mockRejectedValue(new NotFoundException()) };
    const controller = new ImagesController(images as never);

    await expect(
      controller.get('private-image', undefined, responseMock()),
    ).rejects.toThrow(NotFoundException);
    expect(images.get).toHaveBeenCalledWith(
      'private-image',
      undefined,
      undefined,
    );
  });
});

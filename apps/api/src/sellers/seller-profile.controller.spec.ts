import 'reflect-metadata';

import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';

import { SellerProfileController } from './seller-profile.controller';

describe('SellerProfileController', () => {
  it('exposes the self-profile endpoint at the api-client route', () => {
    const handler = Object.getOwnPropertyDescriptor(
      SellerProfileController.prototype,
      'getMyProfile',
    )?.value;

    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('profile');
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
  });
});

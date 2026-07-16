import {
  AUCTION_STATUSES,
  BID_STATUSES,
  LOT_STATUSES,
  SELLER_STATUSES,
  SELLER_TYPES,
  USER_ROLES,
  USER_STATUSES,
} from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import {
  InvalidPersistenceValueError,
  parseAuctionStatus,
  parseBidStatus,
  parseLotStatus,
  parseSellerStatus,
  parseSellerType,
  parseUserRole,
  parseUserStatus,
} from './persistence-value.parsers';

describe('persistence value parsers', () => {
  it.each(USER_ROLES)('parses user role %s', (value) => {
    expect(parseUserRole(value)).toBe(value);
  });

  it.each(USER_STATUSES)('parses user status %s', (value) => {
    expect(parseUserStatus(value)).toBe(value);
  });

  it.each(SELLER_TYPES)('parses seller type %s', (value) => {
    expect(parseSellerType(value)).toBe(value);
  });

  it.each(SELLER_STATUSES)('parses seller status %s', (value) => {
    expect(parseSellerStatus(value)).toBe(value);
  });

  it.each(LOT_STATUSES)('parses lot status %s', (value) => {
    expect(parseLotStatus(value)).toBe(value);
  });

  it.each(AUCTION_STATUSES)('parses auction status %s', (value) => {
    expect(parseAuctionStatus(value)).toBe(value);
  });

  it.each(BID_STATUSES)('parses bid status %s', (value) => {
    expect(parseBidStatus(value)).toBe(value);
  });

  it.each([
    {
      parser: parseUserRole,
      entity: 'User',
      field: 'role',
      value: 'invalid',
      recordId: 'user-1',
    },
    {
      parser: parseUserStatus,
      entity: 'User',
      field: 'status',
      value: 'invalid',
      recordId: 'user-1',
    },
    {
      parser: parseSellerType,
      entity: 'SellerProfile',
      field: 'sellerType',
      value: 'invalid',
      recordId: 'seller-1',
    },
    {
      parser: parseSellerStatus,
      entity: 'SellerProfile',
      field: 'status',
      value: 'invalid',
      recordId: 'seller-1',
    },
    {
      parser: parseLotStatus,
      entity: 'Lot',
      field: 'status',
      value: 'invalid',
      recordId: 'lot-1',
    },
    {
      parser: parseAuctionStatus,
      entity: 'Auction',
      field: 'status',
      value: 'invalid',
      recordId: 'auction-1',
    },
    {
      parser: parseBidStatus,
      entity: 'Bid',
      field: 'status',
      value: 'bad',
      recordId: 'bid-1',
    },
  ])(
    'throws a persistence error for invalid $entity.$field values',
    ({ parser, entity, field, value, recordId }) => {
      try {
        parser(value, recordId);
        throw new Error('Expected parser to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidPersistenceValueError);
        expect(error).toMatchObject({
          entity,
          field,
          value,
          recordId,
        });
      }
    },
  );
});

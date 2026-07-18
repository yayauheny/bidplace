import { LISTING_STATUSES, PRODUCT_STATUSES, SELLER_STATUSES } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';
import { InvalidPersistenceValueError, parseListingStatus, parseProductStatus, parseSellerStatus } from './persistence-value.parsers';
describe('persistence value parsers', () => {
  it.each(SELLER_STATUSES)('parses SellerProfile status %s', (value) => expect(parseSellerStatus(value)).toBe(value));
  it.each(PRODUCT_STATUSES)('parses Product status %s', (value) => expect(parseProductStatus(value)).toBe(value));
  it.each(LISTING_STATUSES)('parses Listing status %s', (value) => expect(parseListingStatus(value)).toBe(value));
  it('rejects an invalid Listing status', () => expect(() => parseListingStatus('ACTIVE', 'listing-1')).toThrow(InvalidPersistenceValueError));
});

import {
  AUCTION_STATUSES,
  BID_STATUSES,
  LOT_STATUSES,
  SELLER_STATUSES,
  SELLER_TYPES,
  USER_ROLES,
  USER_STATUSES,
  type AuctionStatus,
  type BidStatus,
  type LotStatus,
  type SellerStatus,
  type SellerType,
  type UserRole,
  type UserStatus,
} from '@bidplace/contracts';

import { InvalidPersistenceValueError } from './invalid-persistence-value.error';
export { InvalidPersistenceValueError } from './invalid-persistence-value.error';

function parseEnumValue<T extends readonly string[]>(options: {
  entity: string;
  field: string;
  value: string;
  values: T;
  recordId: string | undefined;
}): T[number] {
  if ((options.values as readonly string[]).includes(options.value)) {
    return options.value as T[number];
  }

  const errorOptions: {
    entity: string;
    field: string;
    value: string;
    recordId?: string;
  } = {
    entity: options.entity,
    field: options.field,
    value: options.value,
  };

  if (options.recordId !== undefined) {
    errorOptions.recordId = options.recordId;
  }

  throw new InvalidPersistenceValueError(errorOptions);
}

export function parseUserRole(value: string, recordId?: string): UserRole {
  return parseEnumValue({
    entity: 'User',
    field: 'role',
    value,
    values: USER_ROLES,
    recordId,
  });
}

export function parseUserStatus(value: string, recordId?: string): UserStatus {
  return parseEnumValue({
    entity: 'User',
    field: 'status',
    value,
    values: USER_STATUSES,
    recordId,
  });
}

export function parseSellerType(
  value: string,
  recordId?: string,
): SellerType {
  return parseEnumValue({
    entity: 'SellerProfile',
    field: 'sellerType',
    value,
    values: SELLER_TYPES,
    recordId,
  });
}

export function parseSellerStatus(
  value: string,
  recordId?: string,
): SellerStatus {
  return parseEnumValue({
    entity: 'SellerProfile',
    field: 'status',
    value,
    values: SELLER_STATUSES,
    recordId,
  });
}

export function parseLotStatus(value: string, recordId?: string): LotStatus {
  return parseEnumValue({
    entity: 'Lot',
    field: 'status',
    value,
    values: LOT_STATUSES,
    recordId,
  });
}

export function parseAuctionStatus(
  value: string,
  recordId?: string,
): AuctionStatus {
  return parseEnumValue({
    entity: 'Auction',
    field: 'status',
    value,
    values: AUCTION_STATUSES,
    recordId,
  });
}

export function parseBidStatus(value: string, recordId?: string): BidStatus {
  return parseEnumValue({
    entity: 'Bid',
    field: 'status',
    value,
    values: BID_STATUSES,
    recordId,
  });
}

import {
  LISTING_STATUSES,
  PRODUCT_STATUSES,
  SELLER_STATUSES,
  SELLER_TYPES,
  USER_ROLES,
  USER_STATUSES,
  type ListingStatus,
  type ProductStatus,
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

export function parseProductStatus(value: string, recordId?: string): ProductStatus {
  return parseEnumValue({
    entity: 'Product',
    field: 'status',
    value,
    values: PRODUCT_STATUSES,
    recordId,
  });
}

export function parseListingStatus(
  value: string,
  recordId?: string,
): ListingStatus {
  return parseEnumValue({
    entity: 'Listing',
    field: 'status',
    value,
    values: LISTING_STATUSES,
    recordId,
  });
}

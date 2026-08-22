export const imageKey = {
  productImage: (id: string) => `product-image:${id}`,
  creationStep: (id: string) => `creation-step:${id}`,
  sellerPhoto: (sellerProfileId: string) => `seller-photo:${sellerProfileId}`,
} as const;

export type ImageKeyKind = 'product-image' | 'creation-step' | 'seller-photo';

export type ParsedImageKey = {
  kind: ImageKeyKind;
  id: string;
};

export function parseImageKey(key: string): ParsedImageKey {
  const separatorIndex = key.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error(`Invalid image key: ${key}`);
  }

  const kind = key.slice(0, separatorIndex) as ImageKeyKind;
  const id = key.slice(separatorIndex + 1);

  if (
    !id ||
    (kind !== 'product-image' &&
      kind !== 'creation-step' &&
      kind !== 'seller-photo')
  ) {
    throw new Error(`Invalid image key: ${key}`);
  }

  return { kind, id };
}

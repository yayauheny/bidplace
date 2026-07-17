import * as ImagePicker from 'expo-image-picker';

export async function assetToBlob(
  asset: ImagePicker.ImagePickerAsset,
): Promise<Blob | File> {
  if (asset.file) {
    return asset.file;
  }

  const response = await fetch(asset.uri);
  return response.blob();
}

export function getImageAssetKey(asset: ImagePicker.ImagePickerAsset): string {
  return asset.assetId ?? asset.uri;
}

export function mergeSelectedImages(
  currentImages: readonly ImagePicker.ImagePickerAsset[],
  nextImages: readonly ImagePicker.ImagePickerAsset[],
): ImagePicker.ImagePickerAsset[] {
  const mergedImages = new Map<string, ImagePicker.ImagePickerAsset>();

  for (const image of [...currentImages, ...nextImages]) {
    mergedImages.set(getImageAssetKey(image), image);
  }

  return [...mergedImages.values()];
}

export function toIsoInput(value: Date): string {
  return value.toISOString();
}

export function formatNumberInput(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }

  return String(value);
}

export function parseRequiredNumberInput(value: string): number {
  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return Number.NaN;
  }

  return Number(trimmedValue);
}

export function parseOptionalNumberInput(value: string): number | null {
  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return null;
  }

  return Number(trimmedValue);
}

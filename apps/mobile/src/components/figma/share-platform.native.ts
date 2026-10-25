import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export function publicShareOrigin() {
  return 'https://bid.place';
}

export async function copyPublicLink(url: string) {
  await Clipboard.setStringAsync(url);
}

let exporting = false;

export async function downloadQrPng(dataUrl: string, filename: string) {
  if (exporting) throw new Error('PNG export already in progress');
  exporting = true;
  try {
    if (!(await Sharing.isAvailableAsync()))
      throw new Error('PNG sharing unavailable');
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(dataUrl.split(',')[1], { encoding: 'base64' });
    // Receivers may open the URI after shareAsync resolves; retain it in OS cache.
    await Sharing.shareAsync(file.uri, {
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: 'Сохранить QR',
    });
  } finally {
    exporting = false;
  }
}

import { getApiUrl } from '../environment';

const imagePath = /^\/api\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadCover(path: string, access: 'public' | 'participant'): Promise<Blob> {
  if (!imagePath.test(path)) throw new Error('Обложка недоступна для экспорта.');
  const response = await fetch(new URL(path, getApiUrl()).toString(), {
    credentials: access === 'public' ? 'omit' : 'include',
    mode: 'cors',
    redirect: 'error',
  });
  if (!response.ok) throw new Error('Не удалось загрузить обложку.');
  const type = response.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase();
  if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
    throw new Error('Неподдерживаемый формат обложки.');
  }
  const blob = await response.blob();
  if (!blob.size) throw new Error('Обложка пуста.');
  return blob;
}

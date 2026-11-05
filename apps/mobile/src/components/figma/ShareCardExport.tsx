import { useEffect, useRef, useState } from 'react';
import { Platform, Switch, View } from 'react-native';
import { Image } from 'expo-image';
import { designTokens } from '@bidplace/design-tokens';
import logo from '../../../assets/branding/share-logo.svg';
import { canvasSize, type ShareFormat } from '../../lib/share-card/layout';
import { loadCover } from '../../lib/share-card/media';
import { renderCard } from '../../lib/share-card/renderer';
import { shareFile } from '../../lib/share-card/share-file';
import { workTemplate, type WorkCard } from '../../lib/share-card/templates';
import { AppText, PrimaryButton, SecondaryButton } from '../ui';
import { useApiClient } from '../../providers/api-provider';
import { presentLot } from '../../features/commerce/lot-view';

const formats: Array<{ value: ShareFormat; label: string }> = [
  { value: 'story', label: 'История' }, { value: 'post', label: 'Публикация' },
  { value: 'square', label: 'Квадрат' }, { value: 'original', label: 'Оригинал' },
];

export function ShareCardExport({ publicId, imageId, crop, card, url }: { publicId: string; imageId: string; crop: { x: number; y: number; width: number; height: number } | null; card: Omit<WorkCard, 'link'>; url: string }) {
  const api = useApiClient();
  const [logoUrl, setLogoUrl] = useState<string>();
  const [format, setFormat] = useState<ShareFormat>('story');
  const [includeDescription, setIncludeDescription] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const sale = `${card.price ?? ''}|${card.status ?? ''}`;
  const previousSale = useRef(sale);
  useEffect(() => {
    if (previousSale.current === sale) return;
    previousSale.current = sale;
    generation.current += 1;
    setFile(undefined);
    setPreview(undefined);
    setBusy(false);
  }, [sale]);
  useEffect(() => () => { generation.current += 1; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  if (Platform.OS !== 'web') return null;
  const reset = () => { generation.current += 1; setFile(undefined); setPreview(undefined); setBusy(false); setError(''); };
  const prepare = async (full: boolean) => {
    const operation = ++generation.current;
    setBusy(true); setError(''); setFile(undefined);
    if (!full) setPreview(undefined);
    let stage = 'состояние продажи';
    try {
      const lot = await api.commerce.getLot(publicId);
      const view = lot ? presentLot({ lot, syncedNowMs: Date.parse(lot.serverNow) }) : null;
      stage = 'обложку';
      const cover = await loadCover(`/api/images/${imageId}`, 'public');
      stage = 'логотип';
      if (!logoUrl) throw new Error('Логотип недоступен.');
      stage = 'изображение';
      const layers = workTemplate(format, { ...card, link: `bid.place${new URL(url).pathname}`, price: view?.priceLabel && (view.phase === 'auction-live' || view.phase === 'fixed-live') ? `${lot?.type === 'AUCTION' ? 'Ставка ' : ''}${view.priceLabel}` : null, timer: view?.timerLabel ?? null, status: view?.statusLabel ?? null, description: includeDescription ? card.description : null });
      const image = await renderCard({ cover, logoUrl, format, layers, crop, preview: !full });
      if (operation !== generation.current) return;
      if (full) setFile(new File([image], `bidplace-${format}.jpg`, { type: image.type }));
      else setPreview(URL.createObjectURL(image));
    } catch {
      if (operation === generation.current) setError(`Не удалось подготовить ${stage}. Попробуйте снова.`);
    } finally {
      if (operation === generation.current) setBusy(false);
    }
  };
  const share = async () => {
    if (!file) return;
    try { await shareFile(file, url); } catch { setError('Не удалось поделиться изображением. Попробуйте снова.'); }
  };
  const dimensions = format === 'original' ? 'Пропорции исходного фото' : Object.values(canvasSize(format)).join(' × ');
  return <View style={{ gap: designTokens.space.x2 }}>
    <Image source={logo} onLoad={(event) => setLogoUrl(event.source.url)} accessible={false} style={{ width: 1, height: 1, opacity: 0 }} />
    <AppText role="body">Карточка работы</AppText>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
      {formats.map((item) => <SecondaryButton key={item.value} label={item.label} disabled={busy} onPress={() => { reset(); setFormat(item.value); }} />)}
    </View>
    <AppText role="caption">{`${formats.find((item) => item.value === format)?.label} · ${dimensions}`}</AppText>
    {card.description ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: designTokens.space.x2 }}><Switch accessibilityLabel="Описание" value={includeDescription} onValueChange={(value) => { reset(); setIncludeDescription(value); }} /><AppText role="bodySmall">Описание</AppText></View> : null}
    {preview ? <Image source={{ uri: preview }} accessibilityLabel="Превью карточки" contentFit="contain" style={{ width: '100%', height: 240 }} /> : null}
    {error ? <AppText role="bodySmall" tone="danger">{error}</AppText> : null}
    {file ? <PrimaryButton label="Поделиться изображением" width="full" onPress={() => void share()} /> : <SecondaryButton label={busy ? 'Готовим изображение…' : preview ? 'Подготовить файл' : 'Подготовить изображение'} disabled={busy || !logoUrl} width="full" onPress={() => void prepare(Boolean(preview))} />}
  </View>;
}

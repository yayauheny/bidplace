import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { Image } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';
import type { OrderDetail } from '@bidplace/contracts';
import logo from '../../../assets/branding/bidplace-logo-full.svg';
import { AppText, PrimaryButton, SecondaryButton } from '../../components/ui';
import { canWritePrivateCache } from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import { loadCover } from '../../lib/share-card/media';
import { renderCard } from '../../lib/share-card/renderer';
import { receiptTemplate } from '../../lib/share-card/templates';
import { shareFile } from '../../lib/share-card/share-file';
import { receiptData } from './receipt-data';

export function ReceiptExport({ order }: { order: OrderDetail }) {
  const queryClient = useQueryClient();
  const epoch = usePrivateCacheEpoch(queryClient);
  return Platform.OS === 'web' && order.status === 'COMPLETED' && (order.role === 'buyer' || order.role === 'seller')
    ? <ReceiptExportContent key={`${order.publicId}:${epoch}`} order={order} epoch={epoch} />
    : null;
}

function ReceiptExportContent({ order, epoch }: { order: OrderDetail; epoch: number }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File>();
  const [logoUrl, setLogoUrl] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const active = () => mounted.current && canWritePrivateCache(queryClient, epoch);
  const prepare = async () => {
    if (!active() || order.status !== 'COMPLETED' || !order.completedAt || !order.coverImageUrl) return;
    setBusy(true); setError('');
    try {
      const cover = await loadCover(order.coverImageUrl, 'participant');
      if (!active()) return;
      if (!logoUrl) throw new Error('Логотип недоступен.');
      const layers = receiptTemplate(receiptData(order));
      const image = await renderCard({ cover, logoUrl, format: 'receipt', layers });
      if (active()) setFile(new File([image], `bidplace-order-${order.publicId}.png`, { type: 'image/png' }));
    } catch {
      if (active()) setError('Не удалось подготовить подтверждение. Проверьте доступность обложки.');
    } finally {
      if (active()) setBusy(false);
    }
  };
  const share = async () => {
    if (!file || !active()) return;
    try { await shareFile(file); } catch { if (active()) setError('Не удалось поделиться подтверждением.'); }
  };
  return <View>
    <Image source={logo} onLoad={(event) => setLogoUrl(event.source.url)} accessible={false} style={{ width: 1, height: 1, opacity: 0 }} />
    {!order.coverImageUrl || !order.completedAt ? <AppText role="bodySmall" tone="danger">Данные подтверждения недоступны.</AppText> : null}
    {error ? <AppText role="bodySmall" tone="danger">{error}</AppText> : null}
    {file ? <PrimaryButton label="Поделиться подтверждением" onPress={() => void share()} /> : <SecondaryButton label={busy ? 'Готовим подтверждение…' : 'Подготовить подтверждение'} disabled={busy || !order.coverImageUrl || !order.completedAt || !logoUrl} onPress={() => void prepare()} />}
  </View>;
}

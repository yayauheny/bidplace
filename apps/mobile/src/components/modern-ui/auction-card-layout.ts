type AuctionCardItem = {
  product: { title: string | null; story?: string | null };
  listing: {
    currentPrice: number;
    status: 'LIVE' | 'SCHEDULED' | 'ENDED' | 'CANCELLED' | 'DRAFT';
    endsAt: string;
  } | null;
};

export function getAuctionCardContent(item: AuctionCardItem) {
  const { product, listing } = item;
  const description =
    product.story?.replace(/\s+/g, ' ').trim() ||
    'Авторский предмет с историей и происхождением.';

  return {
    title: product.title ?? 'Предмет',
    description,
    price: listing ? `${listing.currentPrice} BYN` : 'Цена появится позже',
    status: listingLabel(item),
    deadline: deadlineLabel(item),
  };
}

function listingLabel(item: AuctionCardItem): string {
  if (!item.listing) return 'Скоро';
  if (item.listing.status === 'LIVE') return 'Торги идут';
  if (item.listing.status === 'SCHEDULED') return 'Скоро';
  if (item.listing.status === 'CANCELLED') return 'Отменено';
  return 'Завершено';
}

function deadlineLabel(item: AuctionCardItem): string {
  if (!item.listing) return 'Листинг готовится';
  return new Intl.DateTimeFormat('ru-BY', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(item.listing.endsAt));
}

type AuctionCardItem = {
  product: { title: string; story: string };
  listing: {
    currentPrice: number;
    status: 'LIVE' | 'SCHEDULED' | 'ENDED' | 'CANCELLED' | 'DRAFT';
    endsAt: string;
  } | null;
};

export function getAuctionCardContent(item: AuctionCardItem) {
  const { product } = item;
  const description = product.story.replace(/\s+/g, ' ').trim();

  return {
    title: product.title,
    description,
    price: 'Работа автора',
    status: 'Портфолио',
    deadline: 'Подробнее',
  };
}

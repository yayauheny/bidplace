type AuctionCardItem = {
  product: {
    id: string;
    publicId: string;
    title: string;
    story: string | null;
    images: Array<{ id: string; url: string }>;
  };
  sellerProfile: {
    slug: string;
    fullName: string;
    profilePhotoUrl: string;
  };
  listing?: { status: string } | null;
};

export function getAuctionCardContent(item: AuctionCardItem) {
  const { product } = item;
  const description = (product.story ?? '').replace(/\s+/g, ' ').trim();

  return {
    title: product.title,
    description,
    price: 'Работа автора',
    status: 'Портфолио',
    deadline: 'Подробнее',
  };
}

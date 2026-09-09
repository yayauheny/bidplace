export type AuctionCardItem = {
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

export function toAuctionCardItem(item: {
  work: AuctionCardItem['product'];
  author: AuctionCardItem['sellerProfile'];
}): AuctionCardItem {
  return {
    product: item.work,
    sellerProfile: item.author,
    listing: null,
  };
}

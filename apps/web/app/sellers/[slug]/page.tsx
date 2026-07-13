import { PublicSellerScreen } from '../../../src/features/sellers/public-seller-screen';

type SellerPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SellerPage({ params }: SellerPageProps) {
  const { slug } = await params;

  return <PublicSellerScreen slug={slug} />;
}

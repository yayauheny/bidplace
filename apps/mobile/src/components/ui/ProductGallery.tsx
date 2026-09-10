import { WorkGallery } from '../figma/WorkGallery';

type ProductGalleryImage = {
  id: string;
  url: string;
  width?: number | null;
  height?: number | null;
  position?: number;
};

export function ProductGallery({
  images,
  label,
}: {
  images: [ProductGalleryImage, ...ProductGalleryImage[]];
  label: string;
}) {
  return <WorkGallery images={images} label={label} />;
}

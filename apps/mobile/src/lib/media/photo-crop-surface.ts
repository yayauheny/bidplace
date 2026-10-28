import type { Ref } from 'react';
import type { PhotoEdit } from './photo-edit';
export type PhotoCropSurfaceHandle = {
  getEdit: () => PhotoEdit;
  rotate: () => void;
  flip: () => void;
};
export type PhotoCropSurfaceProps = {
  ref?: Ref<PhotoCropSurfaceHandle>;
  uri: string;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  openingCrop: PhotoEdit['crop'];
  cropEnabled: boolean;
  avatar: boolean;
  onChange?: (edit: PhotoEdit) => void;
};

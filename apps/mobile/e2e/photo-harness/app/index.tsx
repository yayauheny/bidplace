import { useEffect, useRef, useState } from 'react';

import { CroppedPhoto } from '../../../src/components/shared/CroppedPhoto';
import { PhotoCropSurface } from '../../../src/lib/media/PhotoCropSurface.web';
import type { PhotoCropSurfaceHandle } from '../../../src/lib/media/photo-crop-surface';
import {
  originalPhotoEdit,
  preparePhotoEdit,
  type PhotoEdit,
} from '../../../src/lib/media/photo-edit';
import type { ImageUploadInput } from '../../../src/lib/media/prepare-image-upload';

type Source = ImageUploadInput & { width: number; height: number };
type Confirmed = {
  uri: string;
  blob: Blob;
  width: number;
  height: number;
  edit: PhotoEdit;
  unchanged: boolean;
  dispose: () => void;
};

export default function PhotoHarness() {
  const cropper = useRef<PhotoCropSurfaceHandle>(null);
  const [source, setSource] = useState<Source>();
  const [edit, setEdit] = useState<PhotoEdit>(originalPhotoEdit);
  const [openingCrop, setOpeningCrop] = useState<PhotoEdit['crop']>(null);
  const [reset, setReset] = useState(0);
  const [confirmed, setConfirmed] = useState<Confirmed>();
  const [status, setStatus] = useState('idle');
  const purpose = new URLSearchParams(window.location.search).has('work')
    ? 'work'
    : 'avatar';

  useEffect(
    () => () => {
      confirmed?.dispose();
    },
    [confirmed],
  );

  const selectFile = async (file: File) => {
    setStatus('loading');
    confirmed?.dispose();
    setConfirmed(undefined);
    if (source) URL.revokeObjectURL(source.uri);
    const uri = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = uri;
      await image.decode();
      setSource({
        uri,
        file,
        fileSize: file.size,
        mimeType: file.type,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setOpeningCrop(null);
      setEdit(originalPhotoEdit);
      setReset((value) => value + 1);
      setStatus('ready');
    } catch (error) {
      URL.revokeObjectURL(uri);
      setStatus(error instanceof Error ? error.message : 'decode failed');
    }
  };

  const confirm = async () => {
    if (!source || !cropper.current) return;
    setStatus('preparing');
    const nextEdit = cropper.current.getEdit();
    try {
      const prepared = await preparePhotoEdit(source, nextEdit, purpose);
      confirmed?.dispose();
      setConfirmed({
        uri: prepared.input.uri,
        blob: prepared.blob,
        width: prepared.input.width ?? source.width,
        height: prepared.input.height ?? source.height,
        edit: nextEdit,
        unchanged: prepared.input.uri === source.uri,
        dispose: prepared.dispose,
      });
      setEdit(nextEdit);
      setStatus('confirmed');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'prepare failed');
    }
  };

  const reopen = () => {
    if (!source || !confirmed) return;
    if (source.uri !== confirmed.uri) URL.revokeObjectURL(source.uri);
    setSource({
      uri: confirmed.uri,
      file: new File([confirmed.blob], 'saved-photo', {
        type: confirmed.blob.type,
      }),
      fileSize: confirmed.blob.size,
      mimeType: confirmed.blob.type,
      width: confirmed.width,
      height: confirmed.height,
    });
    setOpeningCrop(confirmed.edit.crop);
    setEdit({ ...originalPhotoEdit, crop: confirmed.edit.crop });
    setReset((value) => value + 1);
    setStatus('ready');
  };

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <input
        aria-label="source-photo"
        type="file"
        accept="image/jpeg"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void selectFile(file);
        }}
      />
      <button disabled={!source} onClick={() => cropper.current?.rotate()}>
        Rotate
      </button>
      <button disabled={!source} onClick={() => cropper.current?.flip()}>
        Flip
      </button>
      <button disabled={!source} onClick={() => void confirm()}>
        Confirm
      </button>
      <button disabled={!confirmed || purpose !== 'work'} onClick={reopen}>
        Reopen
      </button>
      <output data-testid="status">{status}</output>
      <output data-testid="source-dimensions">
        {source ? JSON.stringify({ width: source.width, height: source.height }) : ''}
      </output>
      <output data-testid="edit">{JSON.stringify(edit)}</output>
      {source ? (
        <div
          data-testid="editor"
          style={{
            width: purpose === 'avatar' ? 366 : 302,
            height: purpose === 'avatar' ? 418 : 368,
            marginTop: 16,
          }}
        >
          <PhotoCropSurface
            key={`${source.uri}:${reset}`}
            ref={cropper}
            uri={source.uri}
            width={source.width}
            height={source.height}
            openingCrop={openingCrop}
            cropEnabled
            avatar={purpose === 'avatar'}
            viewportWidth={purpose === 'avatar' ? 366 : 302}
            viewportHeight={purpose === 'avatar' ? 418 : 368}
            onChange={setEdit}
          />
        </div>
      ) : null}
      {confirmed && purpose === 'avatar' ? (
        <img
          alt="confirmed-photo"
          src={confirmed.uri}
          data-unchanged={confirmed.unchanged}
          style={{ width: 256, height: 256, objectFit: 'cover', marginTop: 16 }}
        />
      ) : null}
      {confirmed && purpose === 'work' ? (
        <div
          data-testid="work-preview"
          data-unchanged={confirmed.unchanged}
          style={{ width: 302, height: 368, marginTop: 16 }}
        >
          <CroppedPhoto
            uri={confirmed.uri}
            component="ProductGallery"
            accessibilityLabel="confirmed-work"
            fallbackLabel="preview unavailable"
            crop={confirmed.edit.crop}
            sourceWidth={confirmed.width}
            sourceHeight={confirmed.height}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ) : null}
    </main>
  );
}

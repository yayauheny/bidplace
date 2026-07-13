export type StoredFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

export abstract class FileStorageService {
  abstract storeImages(files: readonly StoredFile[]): Promise<string[]>;
  abstract deleteFiles(paths: readonly string[]): Promise<void>;
}

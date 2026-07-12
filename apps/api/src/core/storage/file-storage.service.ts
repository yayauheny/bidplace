export type StoredFile = {
  buffer: Buffer;
  originalname: string;
};

export abstract class FileStorageService {
  abstract storeImages(files: readonly StoredFile[]): Promise<string[]>;
}

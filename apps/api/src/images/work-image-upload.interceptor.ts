import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  acceptSupportedUploadMimeType,
  productImageUploadLimits,
  workImageMaxInputBytes,
} from './image-policy';

const singleUpload = FilesInterceptor('images', 1, {
  limits: { fileSize: workImageMaxInputBytes, files: 1 },
  fileFilter: (_request, file, done) =>
    acceptSupportedUploadMimeType(file.mimetype, done),
});
const legacyBatch = FilesInterceptor(
  'images',
  productImageUploadLimits.maxFiles,
  {
    limits: {
      fileSize: productImageUploadLimits.maxFileBytes,
      files: productImageUploadLimits.maxFiles,
    },
    fileFilter: (_request, file, done) =>
      acceptSupportedUploadMimeType(file.mimetype, done),
  },
);

@Injectable()
export class WorkImageUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    // Large input is single-file and replayable; legacy batches keep their original memory ceiling.
    const Upload =
      request.headers['idempotency-key'] !== undefined
        ? singleUpload
        : legacyBatch;
    return new Upload().intercept(context, next);
  }
}

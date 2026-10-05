import { AsyncLocalStorage } from 'node:async_hooks';

import { ServiceUnavailableException } from '@nestjs/common';

const imageProcessingAdmission = new AsyncLocalStorage<true>();
let admissions = 0;
const maxImageProcessingAdmissions = 2;

export async function withImageProcessingAdmission<T>(
  work: () => Promise<T>,
): Promise<T> {
  if (imageProcessingAdmission.getStore()) return work();
  if (admissions >= maxImageProcessingAdmissions) {
    throw new ServiceUnavailableException(
      'Image processing is busy; retry later',
    );
  }
  admissions += 1;
  try {
    return await imageProcessingAdmission.run(true, work);
  } finally {
    admissions -= 1;
  }
}

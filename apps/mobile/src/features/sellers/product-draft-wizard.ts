export const productWizardStep = {
  about: 1,
  images: 2,
  creation: 3,
  review: 4,
} as const;

export type ProductWizardStep =
  (typeof productWizardStep)[keyof typeof productWizardStep];

export type ProductWizardDraft = {
  hasProduct: boolean;
  imageCount: number;
};

export type ProductWizardStepParam = string | number | string[] | undefined;

export function createProductWizardDraft(
  existingProduct?: { images: ReadonlyArray<unknown> } | null,
): ProductWizardDraft {
  return {
    hasProduct: Boolean(existingProduct),
    imageCount: existingProduct?.images.length ?? 0,
  };
}

export function firstRouteParam(
  value: ProductWizardStepParam,
): string | undefined {
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseProductWizardStepParam(
  step: ProductWizardStepParam,
): number {
  if (typeof step === 'number') {
    return Number.isInteger(step) ? step : productWizardStep.about;
  }
  const parsed = Number.parseInt(firstRouteParam(step) ?? '1', 10);
  if (!Number.isInteger(parsed)) return productWizardStep.about;
  return parsed;
}

export function clampProductWizardStep(step: number): ProductWizardStep {
  if (!Number.isInteger(step) || step < productWizardStep.about) {
    return productWizardStep.about;
  }
  if (step > productWizardStep.review) {
    return productWizardStep.review;
  }
  return step as ProductWizardStep;
}

export function canOpenProductWizardStep(
  step: number,
  draft: ProductWizardDraft,
): boolean {
  const normalized = clampProductWizardStep(step);
  switch (normalized) {
    case productWizardStep.about:
      return true;
    case productWizardStep.images:
      return draft.hasProduct;
    case productWizardStep.creation:
    case productWizardStep.review:
      return draft.hasProduct && draft.imageCount > 0;
    default:
      return false;
  }
}

export function highestOpenableProductWizardStep(
  draft: ProductWizardDraft,
): ProductWizardStep {
  if (canOpenProductWizardStep(productWizardStep.review, draft)) {
    return productWizardStep.review;
  }
  if (canOpenProductWizardStep(productWizardStep.images, draft)) {
    return productWizardStep.images;
  }
  return productWizardStep.about;
}

export function resolveProductWizardStep(
  requested: number,
  draft: ProductWizardDraft,
): ProductWizardStep {
  const normalized = clampProductWizardStep(requested);
  if (canOpenProductWizardStep(normalized, draft)) return normalized;
  return highestOpenableProductWizardStep(draft);
}

export function shouldRewriteProductWizardStepParam(
  stepParam: ProductWizardStepParam,
  resolvedStep: ProductWizardStep,
): boolean {
  return firstRouteParam(stepParam) !== String(resolvedStep);
}

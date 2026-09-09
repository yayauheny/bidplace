import { describe, expect, it } from 'vitest';

import {
  canOpenProductWizardStep,
  clampProductWizardStep,
  createProductWizardDraft,
  createProductWizardHref,
  highestOpenableProductWizardStep,
  parseProductWizardStepParam,
  productWizardStep,
  productWizardStepCount,
  productWizardStepOneIncompleteMessage,
  productWizardStepTitles,
  resolveProductWizardStep,
  shouldRewriteProductWizardStepParam,
} from './product-draft-wizard';

const noProduct = createProductWizardDraft(null);
const productWithoutImages = createProductWizardDraft({ images: [] });
const productWithImages = createProductWizardDraft({
  images: [{ id: 'image-1' }],
});

describe('product draft wizard accessibility', () => {
  it('opens only step 1 before a draft product exists', () => {
    expect(canOpenProductWizardStep(productWizardStep.about, noProduct)).toBe(
      true,
    );
    expect(canOpenProductWizardStep(productWizardStep.images, noProduct)).toBe(
      false,
    );
    expect(canOpenProductWizardStep(productWizardStep.creation, noProduct)).toBe(
      false,
    );
    expect(canOpenProductWizardStep(productWizardStep.review, noProduct)).toBe(
      false,
    );
    expect(highestOpenableProductWizardStep(noProduct)).toBe(
      productWizardStep.about,
    );
    expect(resolveProductWizardStep(productWizardStep.review, noProduct)).toBe(
      productWizardStep.about,
    );
  });

  it('opens only step 1 until a draft has photos', () => {
    expect(
      canOpenProductWizardStep(productWizardStep.images, productWithoutImages),
    ).toBe(false);
    expect(
      canOpenProductWizardStep(
        productWizardStep.creation,
        productWithoutImages,
      ),
    ).toBe(false);
    expect(
      canOpenProductWizardStep(productWizardStep.review, productWithoutImages),
    ).toBe(false);
    expect(highestOpenableProductWizardStep(productWithoutImages)).toBe(
      productWizardStep.about,
    );
    expect(
      resolveProductWizardStep(productWizardStep.review, productWithoutImages),
    ).toBe(productWizardStep.about);
    expect(
      resolveProductWizardStep(
        productWizardStep.creation,
        productWithoutImages,
      ),
    ).toBe(productWizardStep.about);
  });

  it('opens all steps when a draft has at least one image', () => {
    expect(
      canOpenProductWizardStep(productWizardStep.creation, productWithImages),
    ).toBe(true);
    expect(
      canOpenProductWizardStep(productWizardStep.review, productWithImages),
    ).toBe(true);
    expect(highestOpenableProductWizardStep(productWithImages)).toBe(
      productWizardStep.review,
    );
    expect(
      resolveProductWizardStep(productWizardStep.review, productWithImages),
    ).toBe(productWizardStep.review);
  });

  it('keeps later steps openable after requesting an earlier step', () => {
    expect(
      resolveProductWizardStep(productWizardStep.about, productWithImages),
    ).toBe(productWizardStep.about);
    expect(
      canOpenProductWizardStep(productWizardStep.images, productWithImages),
    ).toBe(true);
    expect(
      canOpenProductWizardStep(productWizardStep.creation, productWithImages),
    ).toBe(true);
    expect(
      canOpenProductWizardStep(productWizardStep.review, productWithImages),
    ).toBe(true);
  });

  it('parses URL step params without treating them as already resolved', () => {
    expect(parseProductWizardStepParam(undefined)).toBe(productWizardStep.about);
    expect(parseProductWizardStepParam('3')).toBe(productWizardStep.creation);
    expect(parseProductWizardStepParam('0')).toBe(0);
    expect(parseProductWizardStepParam('99')).toBe(99);
    expect(parseProductWizardStepParam(['4'])).toBe(productWizardStep.review);
    expect(parseProductWizardStepParam('not-a-number')).toBe(
      productWizardStep.about,
    );
    expect(parseProductWizardStepParam(2.5)).toBe(productWizardStep.about);
  });

  it('clamps non-integer and out-of-range steps before opening them', () => {
    expect(clampProductWizardStep(2.5)).toBe(productWizardStep.about);
    expect(clampProductWizardStep(99)).toBe(productWizardStep.review);
    expect(clampProductWizardStep(0)).toBe(productWizardStep.about);
    expect(resolveProductWizardStep(99, productWithImages)).toBe(
      productWizardStep.review,
    );
    expect(resolveProductWizardStep(99, productWithoutImages)).toBe(
      productWizardStep.about,
    );
  });

  it('rewrites URL params that do not match the resolved current step', () => {
    expect(
      shouldRewriteProductWizardStepParam('99', productWizardStep.review),
    ).toBe(true);
    expect(
      shouldRewriteProductWizardStepParam('04', productWizardStep.review),
    ).toBe(true);
    expect(
      shouldRewriteProductWizardStepParam('abc', productWizardStep.about),
    ).toBe(true);
    expect(
      shouldRewriteProductWizardStepParam('4', productWizardStep.review),
    ).toBe(false);
    expect(
      shouldRewriteProductWizardStepParam(undefined, productWizardStep.about),
    ).toBe(true);
  });

  it('builds the creation-flow product href without inventing extra params', () => {
    expect(createProductWizardHref('abc123xyz', productWizardStep.review)).toEqual(
      {
        pathname: '/(seller)/products/[id]',
        params: {
          id: 'abc123xyz',
          flow: 'creation',
          step: '4',
        },
      },
    );
  });

  it('keeps the form-level incomplete message distinct from field errors', () => {
    expect(productWizardStepOneIncompleteMessage).toBe(
      'Проверьте обязательные поля',
    );
    expect(productWizardStepOneIncompleteMessage).not.toBe('Введите название');
  });

  it('names Figma creation screens without sale language', () => {
    expect(productWizardStepTitles[productWizardStep.photos]).toBe(
      'Основная информация',
    );
    expect(productWizardStepTitles[productWizardStep.details]).toBe(
      'Детали работы',
    );
    expect(productWizardStepTitles[productWizardStep.story]).toBe(
      'История создания',
    );
    expect(productWizardStepCount).toBe(4);
    expect(productWizardStep.photos).toBe(1);
    expect(productWizardStep.details).toBe(2);
  });
});

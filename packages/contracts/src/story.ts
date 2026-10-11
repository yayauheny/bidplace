import { z } from 'zod';

import { uuidSchema } from './primitives';

export const STORY_LIMITS = {
  maxImages: 5,
  maxTextBlocks: 20,
  headingMaxLength: 200,
  paragraphMaxLength: 5000,
  altTextMaxLength: 300,
  maxFileBytes: 5 * 1024 * 1024,
  maxStoryImageBytes: 20 * 1024 * 1024,
} as const;

const headingBlockSchema = z
  .object({
    id: uuidSchema.optional(),
    type: z.literal('HEADING'),
    text: z.string().trim().min(1).max(STORY_LIMITS.headingMaxLength),
  })
  .strict();

const paragraphBlockSchema = z
  .object({
    id: uuidSchema.optional(),
    type: z.literal('PARAGRAPH'),
    text: z.string().trim().min(1).max(STORY_LIMITS.paragraphMaxLength),
  })
  .strict();

const imageBlockSchema = z
  .object({
    id: uuidSchema.optional(),
    type: z.literal('IMAGE'),
    mediaAssetId: uuidSchema,
    altText: z.string().trim().min(1).max(STORY_LIMITS.altTextMaxLength).nullable().optional(),
  })
  .strict();

export const storyBlockWriteSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  paragraphBlockSchema,
  imageBlockSchema,
]);

export const storyWriteRequestSchema = z
  .object({
    storyToken: z.number().int().nonnegative(),
    idempotencyKey: z.string().trim().min(1).max(80).optional(),
    blocks: z.array(storyBlockWriteSchema).max(STORY_LIMITS.maxImages + STORY_LIMITS.maxTextBlocks),
  })
  .strict()
  .superRefine((value, context) => {
    const images = value.blocks.filter((block) => block.type === 'IMAGE');
    const text = value.blocks.length - images.length;
    if (images.length > STORY_LIMITS.maxImages) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Story has too many images',
        path: ['blocks'],
      });
    }
    if (text > STORY_LIMITS.maxTextBlocks) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Story has too many text blocks',
        path: ['blocks'],
      });
    }
    const ids = value.blocks.flatMap((block) => (block.id ? [block.id] : []));
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Story block ids must be unique',
        path: ['blocks'],
      });
    }
  });

export const storyBlockSchema = z.discriminatedUnion('type', [
  headingBlockSchema.extend({ id: uuidSchema, position: z.number().int().nonnegative() }),
  paragraphBlockSchema.extend({ id: uuidSchema, position: z.number().int().nonnegative() }),
  imageBlockSchema.extend({ id: uuidSchema, position: z.number().int().nonnegative() }),
]);

export const storyResponseSchema = z
  .object({
    storyToken: z.number().int().nonnegative(),
    blocks: z.array(storyBlockSchema),
  })
  .strict();

export type StoryWriteRequest = z.infer<typeof storyWriteRequestSchema>;
export type StoryBlock = z.infer<typeof storyBlockSchema>;
